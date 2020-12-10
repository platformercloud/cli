import { flags } from '@oclif/command';
import { Listr } from 'listr2';
import Command from '../base-command';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import { applyManifest } from '../modules/gitops/api';
import { FileInfo, validateManifestPath } from '../modules/gitops/fs';
import { parseK8sManifestsFromFile } from '../modules/gitops/parser';
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
      await applyFiles(files, { ...ctx, isDir }).run();
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

function applyFiles(files: FileInfo[], ctx: TaskCtx) {
  return new Listr<TaskCtx>(
    files.map((file) => {
      return {
        title: `File ${file.filepath}`,
        task: async function processFile(ctx, task) {
          const { orgId, projectId, envId } = ctx;
          const { filepath, extension } = file;
          const manifests = await parseK8sManifestsFromFile(
            filepath,
            extension
          );
          if (!manifests.length) {
            // return cli.error('No valid Kubernetes manifests found', {
            //   exit: 1,
            // });
            task.skip('No valid Kubernetes manifests found');
          }
          return task.newListr(
            manifests.map((manifest, idx) => {
              return {
                title: `mainfest ${idx + 1}/${manifests.length} - ${
                  manifest.metadata.name || ''
                } (${manifest.kind})`,
                task: async (ctx, subTask): Promise<void> => {
                  await applyManifest(orgId, projectId, envId, manifest);
                },
                bottomBar: Infinity,
              };
            }),
            {
              concurrent: false,
              rendererOptions: {
                collapse: false,
                showSubtasks: true,
                collapseErrors: false,
              },
              exitOnError: false,
            }
          );
        },
      };
    }),
    {
      ctx,
      concurrent: false,
      exitOnError: false,
      rendererOptions: {
        collapse: false,
        showSubtasks: true,
        collapseErrors: false,
      },
    }
  );
}
