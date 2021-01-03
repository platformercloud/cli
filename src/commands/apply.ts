import { flags } from '@oclif/command';
import chalk = require('chalk');
import { cli } from 'cli-ux';
import { defer, from, Observable, of } from 'rxjs';
import {
  catchError,
  filter,
  last,
  map,
  mergeAll,
  mergeMap,
  shareReplay,
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
} from '../modules/gitops/manifest-file';
import { writeHAR } from '../modules/util/fetch';
import { tryValidateCommonFlags } from '../modules/util/validations';

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
    try {
      const { files, isDir } = await validateManifestPath(args.filepath);
      await createOutputPath(ctx.envId);
      const manifestFileArr = files.map((file) => new ManifestFile(file));
      const parsedFiles = from(manifestFileArr).pipe(
        map((f) => defer(() => f.parseFile())),
        mergeAll(5),
        catchError((f) => of(null)),
        filter((f): f is ManifestFile => f !== null),
        shareReplay()
      );
      try {
        // apply configmaps & secrets
        await applyManifests(parsedFiles, ctx, true, 'configurations');
        // apply other manifests
        await applyManifests(parsedFiles, ctx, false, 'other manifests');
      } catch (error) {
        // skip waiting tasks
        await parsedFiles.forEach((m) => m.skipOnError());
        // wait till all tasks are either complete or skipped
        await parsedFiles
          .pipe(mergeMap((file) => file.manifests))
          .pipe(mergeMap((manifest) => manifest.subject))
          .toPromise();
      }
    } catch (err) {
      console.log(err);
      return this.error(err.message, { exit: 1 });
    } finally {
      writeHAR();
    }
  }
}

async function applyManifests(
  parsedFiles: Observable<ManifestFile>,
  ctx: Record<'orgId' | 'projectId' | 'envId', string>,
  isPrioritizedKind: boolean,
  manifestType: string
) {
  cli.action.start(`Applying ${manifestType}`);
  const manifests = parsedFiles.pipe(
    mergeMap((file) => file.getManifests(isPrioritizedKind))
  );
  const { length: mainifestCount } = await manifests
    .pipe(mergeMap(async (manifest) => manifest.applyManifest(ctx), 5))
    .pipe(toArray())
    .toPromise();
  if (mainifestCount === 0) {
    cli.action.stop(`No ${manifestType} found`);
    return;
  }
  const incompleteManifests = await manifests
    .pipe(
      mergeMap(async (manifest) => {
        if (manifest.state === ManifestState.MULTIPLE_OBJECTS_FOUND) {
          return manifest;
        }
        return null;
      }, 1)
    )
    .pipe(filter((m): m is ManifestObject => m !== null))
    .pipe(toArray())
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
