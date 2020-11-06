import { flags } from '@oclif/command';
import chalk = require('chalk');
import Command from '../base-command';
import config from '../modules/config';

export default class Logout extends Command {
  static description = 'Log out of the CLI (from the current context)';

  static flags = {
    help: flags.help({ char: 'h' }),
    all: flags.boolean({
      char: 'A',
      description: 'Log out of all contexts',
      required: false,
      exclusive: ['context'],
    }),
    context: flags.string({
      required: false,
      description:
        'Name of a specific context to log out from (defaults to current context)',
      default: config.get('currentContext'),
      options: Object.keys(config.get('contexts')),
      exclusive: ['all'],
    }),
  };

  async run() {
    const { flags } = this.parse(Logout);

    if (flags.all) {
      const contexts = config.get('contexts');
      Object.keys(contexts).forEach((context) => {
        this.logoutFromContext(context);
      });
      return;
    }

    this.logoutFromContext(flags.context);
  }

  private logoutFromContext(context: string) {
    config.set(`contexts.${context}.auth`, {});
    this.log('Logged out of context', chalk.blueBright(context));
  }
}
