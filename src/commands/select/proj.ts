import { flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import Command from '../../base-command';
import config from '../../modules/config';
import { fetchProjects, Project } from '../../modules/auth/project';
import { getDefaultOrganization } from '../../modules/config/helpers';
import { tryValidateCommonFlags } from '../../modules/util/validations';

export default class SelectProject extends Command {
  static aliases = ['select:project', 'select:proj'];

  static description =
    'Select a default Project for your current context. Requires an Organization to be set with select:org or using the --o flag';

  static examples = [
    '$ platformer select:project # interactive select',
    '$ platformer select:project <project-name>',
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    organization: flags.string({
      char: 'O',
      description: 'organization name',
      required: false,
      default: () => getDefaultOrganization()?.name,
    }),
  };

  static args = [
    {
      name: 'project',
      required: false,
      description:
        '(OPTIONAL) Name of the Project to set in the current context. If not provided, the CLI will open an interactive prompt to select an Project.',
    },
  ];

  async run() {
    const { flags, args } = this.parse(SelectProject);
    const { orgId } = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true,
      },
    });

    const projectList = await fetchProjects(orgId);
    if (
      projectList?.length === 0 ||
      projectList?.length === null ||
      projectList?.length === undefined
    ) {
      return this.error('You need create a project first', { exit: 1 });
    }
    let project: Project | undefined;
    if (args.project) {
      project = projectList.find((p) => p.name === args.project);
      if (!project) {
        return this.error(
          `A Project with the provided name "${args.project}" does not exist (or you do not have access to it)`,
          { exit: 1 }
        );
      }
    } else {
      const { projectName } = await inquirer.prompt([
        {
          name: 'projectName',
          message: 'Select a project',
          type: 'list',
          choices: projectList,
        },
      ]);
      project = projectList.find((p) => p.name === projectName);
    }

    const currentContext: string = config.get('currentContext');
    config.set(`contexts.${currentContext}.project`, {
      id: project!.project_id,
      name: project!.name,
    });

    this.log(
      'Successfully set',
      chalk.blueBright(`"${project!.name}"`),
      'as the default Project in the',
      chalk.blueBright(`"${currentContext}"`),
      'context'
    );
  }
}
