import { flags } from '@oclif/command';
import * as chalk from 'chalk';
import * as inquirer from 'inquirer';
import Command from '../../base-command';
import {
  fetchOrganizations,
  Organization,
} from '../../modules/auth/organization';
import config from '../../modules/config';

export default class SelectOrganization extends Command {
  static aliases = ['select:organization', 'select:org', 'select:organisation'];

  static description =
    'Select a default Organization for your current context.';
  static examples = [
    '$ platformer select:org # interactive select',
    '$ platformer select:org <organization-name>',
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
  };

  static args = [
    {
      name: 'organization',
      required: false,
      description:
        '(OPTIONAL) Name of the Organization to set in the current context. If not provided, the CLI will open an interactive prompt to select an Organization.',
    },
  ];

  async run() {
    const { args } = this.parse(SelectOrganization);

    const orgList = await fetchOrganizations();

    let selectedOrgName: string = args.organization;
    let selectedOrg: Organization | undefined;

    if (selectedOrgName) {
      selectedOrg = orgList.find((o) => o.name === selectedOrgName);
      if (!selectedOrg) {
        return this.error(
          `An Organization with the provided name "${selectedOrgName}" does not exist (or you do not have access to it)`,
          { exit: 1 }
        );
      }
    } else {
      const { orgName } = await inquirer.prompt([
        {
          name: 'orgName',
          message: 'Select an organization',
          type: 'list',
          choices: orgList,
        },
      ]);
      selectedOrgName = orgName;
      selectedOrg = orgList.find((o) => o.name === selectedOrgName);
    }

    const currentContext: string = config.get('currentContext');
    config.set(`contexts.${currentContext}.organization`, {
      id: selectedOrg!.organization_id,
      name: selectedOrg!.name,
    });

    this.log(
      'Successfully set',
      chalk.blueBright(`"${selectedOrgName}"`),
      'as the default Organization in the',
      chalk.blueBright(`"${currentContext}"`),
      'context'
    );
  }
}
