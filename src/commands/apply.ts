import { flags } from '@oclif/command';
import Command from '../base-command';
import {
  getDefaultEnvironment,
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';
import { validateManifestFile } from '../modules/gitops/fs';
import { parseK8sManifestsFromFile } from '../modules/gitops/parser';

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
    const { args } = this.parse(Apply);

    try {
      const { filepath, extension } = validateManifestFile(args.filepath);
      const manifests = await parseK8sManifestsFromFile(filepath, extension);
      if (!manifests.length) {
        return this.error('No valid Kubernetes manifests found', { exit: 1 });
      }
      manifests.forEach((m) => {
        this.log(`Applying ${m.kind} "${m.metadata?.name}"`);
      });
    } catch (err) {
      return this.error(err.message, { exit: 1 });
    }
  }
}
