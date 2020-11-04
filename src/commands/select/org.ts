import { Command, flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import {
  getOrganizationIdByName,
  getOrganizationNamesList,
} from '../../modules/auth/organization';
import config from '../../modules/config';

export default class Org extends Command {
  static description = 'select org';

  static examples = [
    `$ pctl org
org world from ./src/hello.ts!
`
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: 'n', description: 'name to print' }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: 'f' })
  };

  static args = [{ name: 'file' }];

  async run() {
    const { args, flags } = this.parse(Org);

    const orgList = await getOrganizationNamesList();

    let org = flags.org;
    if (!org) {
      let responses: any = await inquirer.prompt([
        {
          name: 'organization',
          message: 'Select an organization',
          type: 'list',
          choices: orgList
        }
      ]);
      org = responses.organization;
    }

    const selectedOrgId = getOrganizationIdByName(org);

    const currentContext: string = config.get('currentContext');
    config.set(`contexts.${currentContext}.organization`, { id: selectedOrgId, name: org });

    this.log(chalk.green('Successfully saved'), chalk.blue(org), chalk.green(' as default organization'))

    // const name = flags.name ?? 'world'
    // this.log('org select')
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }
  }
}
