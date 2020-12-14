import { flags } from '@oclif/command';
import * as chalk from 'chalk';
import { Listr } from 'listr2';
import { from, of } from 'rxjs';
import { catchError, filter, mergeMap, shareReplay } from 'rxjs/operators';
import Command from '../base-command';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import { createOutputPath, validateManifestPath } from '../modules/gitops/fs';
import { ManifestFile } from '../modules/gitops/manifest-file';
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
      const taskPromise = applyFiles(manifestFileArr, { ...ctx, isDir }).run();
      const parsedFiles = from(manifestFileArr).pipe(
        mergeMap((f) => f.parseFile(), 2),
        catchError((f) => of(null)),
        filter((f): f is ManifestFile => f !== null),
        shareReplay()
      );
      try {
        // apply configmaps & secrets
        await parsedFiles
          .pipe(mergeMap((f) => f.applyManifestsAsObservableArr(true, ctx)))
          .pipe(mergeMap((s) => s(), 1))
          .toPromise();
        // apply other manifests
        await parsedFiles
          .pipe(mergeMap((f) => f.applyManifestsAsObservableArr(false, ctx)))
          .pipe(mergeMap((s) => s(), 1))
          .toPromise();
      } catch (error) {
        await parsedFiles.forEach((m) => m.skipOnError()).catch(() => {});
      }
      await taskPromise;
    } catch (err) {
      return this.error(err.message, { exit: 1 });
    } finally {
      writeHAR();
    }
  }
}

interface TaskCtx extends Record<'orgId' | 'projectId' | 'envId', string> {
  isDir: boolean;
}

function applyFiles(files: ManifestFile[], ctx: TaskCtx) {
  return new Listr<TaskCtx>(
    files.map((manifestFile) => {
      return {
        title: `File ${manifestFile.file.filepath}`,
        task: async function processFile(_, task) {
          await delay(2000);
          manifestFile.sub.subscribe({
            next: (v) => (task.output = v),
            error: (v) => (task.output = v),
          });
          await manifestFile.sub.toPromise().catch(() => {});
          const manifests = manifestFile.manifests;
          if (!manifests.length) {
            task.skip('No valid Kubernetes manifests found');
          }
          return task.newListr(
            manifests.map((manifest, idx) => {
              const title = `mainfest ${idx + 1}/${manifests.length} - ${
                manifest.metadata.name || ''
              } (${manifest.kind})`;
              return {
                title,
                task: async (_, subTask) => {
                  // return manifestFile.subjects[idx];
                  // return new Observable((observer) => {
                  //   manifestFile.subjects[idx].subscribe(observer);
                  // });
                  manifestFile.subjects[idx].subscribe({
                    next: (v) => (subTask.output = v),
                    error: (v) => (subTask.output = chalk.red(v)),
                  });
                  await manifestFile.subjects[idx]
                    .pipe(catchError((v) => v.toString()))
                    .toPromise();
                },
                bottomBar: Infinity,
                options: { persistentOutput: true },
              };
            }),
            {
              concurrent: true,
              rendererOptions: {
                collapse: false,
                showSubtasks: true,
                collapseErrors: false,
                collapseSkips: false,
                clearOutput: false,
              },
              exitOnError: false,
            }
          );
        },
      };
    }),
    {
      concurrent: true,
      exitOnError: false,
      rendererOptions: {
        collapse: false,
        showSubtasks: true,
        collapseErrors: false,
        clearOutput: false,
        collapseSkips: false,
      },
    }
  );
}

function delay(ms: number) {
  return new Promise<void>((r) => {
    setTimeout(() => r(), ms);
  });
}
