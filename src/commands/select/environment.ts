import { flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import Command from '../../base-command';
import { Environment, fetchEnvironments } from '../../modules/apps/environment';
import config from '../../modules/config';
import {
  getDefaultOrganization,
  getDefaultProject,
} from '../../modules/config/helpers';
import { tryValidateFlags } from '../../modules/util/validations';

export default class SelectEnvironment extends Command {
  static aliases = ['select:environment', 'select:env'];

  static description = 'Select a default Environment for your current context.';
  static examples = [
    '$ platformer select:environment # interactive select',
    '$ platformer select:env <environment-name>',
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
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
      name: 'environment',
      required: false,
      description:
        '(OPTIONAL) Name of the Environment to set in the current context. If not provided, the CLI will open an interactive prompt to select an Environment.',
    },
  ];

  async run() {
    const { args, flags } = this.parse(SelectEnvironment);
    const { orgId, projectId } = await tryValidateFlags({
      organization: {
        name: flags.organization,
        required: true,
      },
      project: {
        name: flags.project,
        required: true,
      },
    });

    const envList = await fetchEnvironments(orgId, projectId!);

    let envName: string = args.environment;
    let env: Environment | undefined;
    if (envName) {
      env = envList.find((env) => env.name === envName);
      if (!env) {
        return this.error(
          `An Environment with the provided name "${envName}" does not exist in the selected Project`,
          {
            exit: 1,
            suggestions: [
              'Check if you are in the right Project/Organization using `$ platformer select -h`',
            ],
          }
        );
      }
    } else {
      const { selectedEnv } = await inquirer.prompt([
        {
          name: 'selectedEnv',
          message: 'Select an Environment',
          type: 'list',
          choices: envList,
        },
      ]);
      envName = selectedEnv;
      env = envList.find((e) => e.name === envName);
    }

    const currentContext: string = config.get('currentContext');
    config.set(`contexts.${currentContext}.environment`, {
      name: env!.name,
    });

    this.log(
      'Successfully set',
      chalk.blueBright(`"${envName}"`),
      'as the default Environment in the',
      chalk.blueBright(`"${currentContext}"`),
      'context'
    );
  }
}
