import { Command, flags } from '@oclif/command';
import config from '../../modules/config';
import chalk = require('chalk');
import inquirer = require('inquirer');

export default class SelectContext extends Command {
  static description = 'Select a context';

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [
    {
      name: 'name',
      required: false,
      description:
        '(OPTIONAL) Context name. If not provided, the CLI will prompt an interactive selection',
    },
  ];

  async run() {
    let {
      args: { name: context },
    } = this.parse(SelectContext);

    const contexts = config.get('contexts');

    if (context) {
      const contextExists = Object.keys(contexts).find(
        (name) => name.toLowerCase() === context.toLowerCase()
      );
      if (!contextExists) {
        return this.error(`Invalid context name "${context}"`);
      }
    } else {
      const { selectedContext } = await inquirer.prompt([
        {
          name: 'selectedContext',
          message: 'Select a context',
          type: 'list',
          choices: Object.keys(contexts),
        },
      ]);
      context = selectedContext;
    }

    config.set('currentContext', context);
    this.log(chalk.blueBright(`"${context}"`), 'set as the default context');
  }
}
