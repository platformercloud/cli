import { Command, flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { validateAndGetOrganizationId } from '../../modules/auth/organization';
import { fetchProjects, Project } from '../../modules/auth/project';
import config from '../../modules/config';
import { getDefaultOrganization } from '../../modules/config/helpers';

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
      char: 'o',
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
    let orgId: string;

    try {
      // validate the default organization or the --organization override value.
      orgId = await validateAndGetOrganizationId(flags.organization);
    } catch (error) {
      return this.error(error);
    }

    const projectList = await fetchProjects(orgId);
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
      chalk.green('Successfully set'),
      chalk.blueBright(`"${project!.name}"`),
      chalk.green('as the default Project in the'),
      chalk.blueBright(`"${currentContext}"`),
      chalk.green('context')
    );
  }
}
