import { Command, flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import { getProjectIdByName, getProjectNamesList } from '../../modules/auth/project';
import config from '../../modules/config';

export default class Project extends Command {
  static description = 'Select project';

  async run() {
    const { args, flags } = this.parse(Project);

    const projectsList = await getProjectNamesList();

    let project = flags.project;
    if (!project) {
      let responses: any = await inquirer.prompt([
        {
          name: 'project',
          message: 'Select a project',
          type: 'list',
          choices: projectsList
        }
      ]);

      project = responses.project;
    }

    // TODO: project list not loading
    this.log(`Selected project ${project}`);

    const selectProjectId = getProjectIdByName(project);

    const currentContext: string = config.get('currentContext');
    config.set(`contexts.${currentContext}.project`, { id: selectProjectId, name: project });

    this.log(chalk.green('Successfully saved'), chalk.blue(project), chalk.green(' as default project'))
  }
}
