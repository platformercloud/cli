import { flags } from '@oclif/command';
import chalk = require('chalk');
import Command from '../base-command';
import config from '../modules/config';
import {
  getDefaultOrganization,
  getDefaultProject,
} from '../modules/config/helpers';

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
      char: 'o',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => getDefaultOrganization()?.name,
    }),
    project: flags.string({
      char: 'p',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => getDefaultProject()?.name,
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

    

  }
}
