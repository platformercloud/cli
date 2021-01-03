import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { defer, from, Observable, of } from 'rxjs';
import {
  catchError,
  filter,
  map,
  mergeAll,
  mergeMap,
  shareReplay,
  takeUntil,
  toArray,
} from 'rxjs/operators';
import Command from '../base-command';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import { createOutputPath, validateManifestPath } from '../modules/gitops/fs';
import {
  ManifestFile,
  ManifestObject,
  ManifestState,
  skippedStateNotifier,
  skipRemainingManifests,
} from '../modules/gitops/manifest-file';
import { writeHAR } from '../modules/util/fetch';
import { tryValidateCommonFlags } from '../modules/util/validations';
import chalk = require('chalk');

export default class Apply extends Command {
  static description =
    'Create resources in Platformer Console using a Kubernetes YAMLs';

  static flags = {
    help: flags.help({ char: 'h' }),
    all: flags.boolean({
      char: 'A',
      description: 'Log out of all contexts',
      required: false,
      exclusive: ['context'],
    }),
    organization: flags.string({
      char: 'O',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => getDefaultOrganization()?.name,
    }),
    project: flags.string({
      char: 'P',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => getDefaultProject()?.name,
    }),
    environment: flags.string({
      char: 'E',
      description: 'Environment Name',
      required: false,
      multiple: false,
      default: () => getDefaultEnvironment()?.name,
    }),
  };

  static args = [
    {
      name: 'filepath',
      required: true,
      description: 'Path to YAML file',
    },
  ];

  async run() {
    const { flags, args } = this.parse(Apply);
    const context = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true,
      },
      project: {
        name: flags.project,
        required: true,
      },
      environment: {
        name: flags.environment,
        required: true,
      },
    });
    const ctx = context as Required<typeof context>;
    const fileFolderPath = args.filepath;
    try {
      const { files, isDir } = await validateManifestPath(fileFolderPath);
      await createOutputPath(ctx.envId);
      const manifestFileArr = files.map((file) => new ManifestFile(file));
      const parsedFiles = from(manifestFileArr).pipe(
        map((f) => defer(() => f.parseFile())),
        mergeAll(5),
        takeUntil(skippedStateNotifier),
        catchError((f) => of(null)),
        filter((f): f is ManifestFile => f !== null),
        shareReplay()
      );
      try {
        // step1: apply configmaps & secrets
        await applyManifests(parsedFiles, ctx, 1, {
          start: 'Applying configurations',
        });
        // step2: apply deployments and jobs
        await applyManifests(parsedFiles, ctx, 2, {
          start: 'Applying deployments',
        });
        // step3: apply other manifests
        await applyManifests(parsedFiles, ctx, null, {
          start: 'Applying other manifests',
        });
      } catch (error) {
        // if error occurs, append msg to the running spinner
        cli.action.stop('Error occured');
        cli.action.start('Waiting until other manifests complete');
        skipRemainingManifests();
        // wait till all running tasks are completed or thrown
        await parsedFiles
          .pipe(
            mergeMap((file) => file.manifests),
            mergeMap((manifest) => manifest.waitTillCompletion())
          )
          .toPromise();
        cli.action.stop();
      }
      const statusArr = await parsedFiles
        .pipe(
          mergeMap((file) => file.manifests.map((manifest) => manifest.state)),
          toArray()
        )
        .toPromise();
      const summary = new Map<ManifestState, number>();
      statusArr.forEach((status) => {
        summary.set(status, (summary.get(status) || 0) + 1);
      });
      const manifestCount = statusArr.length;
      const errCount = summary.get(ManifestState.ERROR) || 0;
      const skippedCount = summary.get(ManifestState.SKIPPED) || 0;
      // msg
      const successCount =
        (summary.get(ManifestState.UNKNOWN_SUCCESS_RESPONSE) || 0) +
        (summary.get(ManifestState.FAILED_TO_WRITE_TO_FILE) || 0) +
        (summary.get(ManifestState.COMPLETE) || 0);
      if (manifestCount === 0) {
        this.error(
          `No valid manifests were found in the ${
            isDir ? 'directory' : 'file'
          }"${fileFolderPath}"`,
          { exit: 1 }
        );
      } else if (manifestCount === successCount) {
        cli.log(chalk.green(`Success`));
      } else if (successCount === 0) {
        cli.log(chalk.red(`Failure`));
      } else {
        cli.log(chalk.yellow(`Failed to apply some manifests.`));
      }
      // counts
      cli.log('Manifests found: ', chalk.blue(manifestCount));
      cli.log('Success count: ', chalk.blue(successCount));
      cli.log(
        'Errors occurred: ',
        errCount === 0 ? chalk.blue(0) : chalk.red(errCount)
      );
      cli.log(
        'Skipped manfests: ',
        skippedCount === 0 ? chalk.blue(0) : chalk.yellow(skippedCount)
      );
    } catch (err) {
      cli.log(err);
      return this.error(err.message, { exit: 1 });
    } finally {
      writeHAR();
    }
  }
}

async function applyManifests(
  parsedFiles: Observable<ManifestFile>,
  ctx: Record<'orgId' | 'projectId' | 'envId', string>,
  priority: 1 | 2 | null,
  msgs: Record<'start', string>
) {
  cli.action.start(msgs.start);
  const manifests = parsedFiles.pipe(
    mergeMap((file) => file.getManifests(priority))
  );
  const { length: mainifestCount } = await manifests
    .pipe(
      mergeMap(async (manifest) => manifest.applyManifest(ctx), 5),
      toArray()
    )
    .toPromise();
  if (mainifestCount === 0) {
    cli.action.stop(`Not found`);
    return;
  }
  const incompleteManifests = await manifests
    .pipe(
      mergeMap(async (manifest) => {
        if (manifest.state === ManifestState.MULTIPLE_OBJECTS_FOUND) {
          return manifest;
        }
        return null;
      }, 1),
      filter((m): m is ManifestObject => m !== null),
      toArray()
    )
    .toPromise();
  if (incompleteManifests.length === 0) {
    cli.action.stop();
    return;
  }
  const incompleteCount = incompleteManifests.length;
  cli.action.stop(
    `${incompleteCount} manifest${
      incompleteCount > 1 ? 's' : ''
    } matched with multiple objects`
  );
  for (const manifest of incompleteManifests) {
    await manifest.applyWithSelectedObject(ctx);
  }
}
