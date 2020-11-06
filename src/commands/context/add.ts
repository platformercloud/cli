import { flags } from '@oclif/command';
import config, {
  defaultPlatformerAPIGateway
} from '../../modules/config';
import cli from 'cli-ux';
import chalk = require('chalk');
import Command from '../../base-command';

export default class AddContext extends Command {
  static description = 'Add a new context';

  static flags = {
    help: flags.help({ char: 'h' })
  };

  static args = [
    {
      name: 'name',
      required: true,
      description: 'Context name (must be unique)'
    }
  ];

  async run() {
    const {
      args: { name: context }
    } = this.parse(AddContext);
    const contexts = config.get('contexts');
    if (
      Object.keys(contexts).find(
        (name) => name.toLowerCase() === context.toLowerCase()
      )
    ) {
      return this.error(`A context with the name "${context}" already exists`, {
        exit: 1
      });
    }

    this.log('Adding new context', chalk.blueBright(`"${context}"`));
    config.set(`contexts.${context}`, {});

    let gatewayURL = defaultPlatformerAPIGateway;
    const isDedicatedInstallation = await cli.confirm(
      'Is this context for a dedicated installation of Platformer Console? (y/n)'
    );
    if (isDedicatedInstallation) {
      gatewayURL = await cli.prompt('Enter the Platformer API Gateway URL', {
        type: 'normal'
      });
    }
    config.set(`contexts.${context}.platformerAPIGateway`, gatewayURL);

    const setAsDefaultContext = await cli.confirm(
      'Would you like to set this context as your default context? (y/n)'
    );
    if (setAsDefaultContext) {
      config.set('currentContext', context);
      this.log('switched default context to', context);
    }

    this.log(chalk.green(`Successfully added new context "${context}"`));
    this.log(
      'To configure a default Organization and Project for this context, use `platformer select:<org/project>`'
    );
  }
}
