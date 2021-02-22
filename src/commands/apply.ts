import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { defer, from, Observable, of } from 'rxjs';
import {
  catchError,
  count,
  filter,
  map,
  mergeAll,
  mergeMap,
  shareReplay,
  takeUntil,
  tap,
  toArray,
} from 'rxjs/operators';
import Command from '../base-command';
import { ensureTargetNamespace } from '../modules/apps/environment';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import { createOutputPath, validateManifestPath } from '../modules/gitops/fs';
import { ManifestFile } from '../modules/gitops/manifest-file';
import {
  getKindToPriorityMap,
  importTypes,
} from '../modules/gitops/manifest-import-types';
import {
  ManifestFileObject,
  ManifestState,
  skippedStateNotifier,
  skipRemainingManifests,
} from '../modules/gitops/manifest-object';
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
    'target-ns': flags.string({
      char: 'T',
      description: 'Target namespace',
      required: false,
      multiple: false,
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
    const targetNS = flags['target-ns'];
    const { orgId, projectId, envId } = ctx;
    if (targetNS) {
      cli.log(`Target namespace [${targetNS}]`);
      await ensureTargetNamespace({ orgId, projectId, envId, name: targetNS });
    }
    const { priorities, priorityMap, importTypeMap } = getKindToPriorityMap(
      importTypes
    );
    try {
      const { files, isDir } = await validateManifestPath(fileFolderPath);
      await createOutputPath(ctx.envId);
      const manifestFileArr = files.map(
        (file) => new ManifestFile(file, priorityMap, targetNS)
      );
      const parsedFiles = from(manifestFileArr).pipe(
        map((f) => defer(() => f.parseFile())),
        mergeAll(5),
        takeUntil(skippedStateNotifier),
        catchError(() => of(null)),
        filter((f): f is ManifestFile => f !== null),
        shareReplay()
      );
      try {
        // apply manifests ordered by priority
        // ignore namespaces if target ns provided
        for (const priority of priorities) {
          if (importTypes[priority].skipIfTargetProvided && targetNS) continue;
          const description = importTypeMap.get(priority)?.description;
          await applyManifests(parsedFiles, ctx, priority, {
            start: `Applying ${description}`,
          });
        }
        // apply all kinds not specified in priority map
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
      const manifestCount = statusArr.length;
      if (manifestCount === 0) {
        this.error(
          `No valid manifests were found in the ${
            isDir ? 'directory' : 'file'
          }"${fileFolderPath}"`,
          { exit: 1 }
        );
      }
      await printLogs(parsedFiles);
      printSummary(statusArr);
    } catch (err) {
      cli.log(err);
      return this.error(err.message, { exit: 1 });
    }
  }
}

async function applyManifests(
  parsedFiles: Observable<ManifestFile>,
  ctx: Record<'orgId' | 'projectId' | 'envId', string>,
  priority: number | null,
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
    cli.action.stop('Not found');
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
      filter((m): m is ManifestFileObject => m !== null),
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

async function printLogs(parsedFiles: Observable<ManifestFile>) {
  const manifests = parsedFiles.pipe(mergeMap((file) => file.manifests));
  const successStates = [
    ManifestState.UNKNOWN_SUCCESS_RESPONSE,
    ManifestState.FAILED_TO_WRITE_TO_FILE,
    ManifestState.COMPLETE,
  ];
  const successTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => successStates.includes(m.state)),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        successTree.insert(`${kind} ${name} applied (${fileName})`, subTree);
        if (manifest.state === ManifestState.UNKNOWN_SUCCESS_RESPONSE) {
          subTree.insert(chalk.yellow('Unknown server response'));
        }
        if (manifest.state === ManifestState.FAILED_TO_WRITE_TO_FILE) {
          subTree.insert(chalk.yellow('Failed to write output to file'));
        }
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.green('Applied resources'));
        successTree.display();
      })
    )
    .toPromise();
  const errorTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => m.state === ManifestState.ERROR),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        errorTree.insert(`${kind} ${name} (${fileName})`, subTree);
        if (manifest.errorMsg) {
          subTree.insert(chalk.red(manifest.errorMsg));
        }
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.red('Failed manifests'));
        errorTree.display();
      })
    )
    .toPromise();
  const skippedTree = cli.tree();
  await manifests
    .pipe(
      filter((m) => m.state === ManifestState.SKIPPED),
      tap((manifest) => {
        const subTree = cli.tree();
        const kind = manifest.manifest.kind;
        const name = manifest.manifest.metadata.name;
        const fileName = manifest.file.file.fileName;
        skippedTree.insert(`${kind} ${name} (${fileName})`, subTree);
      }),
      count(),
      tap((count) => {
        if (count === 0) return;
        cli.log('');
        cli.log(chalk.red('Skipped manifests'));
        skippedTree.display();
      })
    )
    .toPromise();
}

function printSummary(statusArr: ManifestState[]) {
  const manifestCount = statusArr.length;
  const summary = new Map<ManifestState, number>();
  statusArr.forEach((status) => {
    summary.set(status, (summary.get(status) || 0) + 1);
  });
  const errCount = summary.get(ManifestState.ERROR) || 0;
  const skippedCount = summary.get(ManifestState.SKIPPED) || 0;
  // msg
  const successCount =
    (summary.get(ManifestState.UNKNOWN_SUCCESS_RESPONSE) || 0) +
    (summary.get(ManifestState.FAILED_TO_WRITE_TO_FILE) || 0) +
    (summary.get(ManifestState.COMPLETE) || 0);
  cli.log();
  if (manifestCount === successCount) {
    cli.log(chalk.green('Success'));
  } else if (successCount === 0) {
    cli.log(chalk.red('Failure'));
  } else {
    cli.log(chalk.yellow('Failed to apply some manifests.'));
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
}
