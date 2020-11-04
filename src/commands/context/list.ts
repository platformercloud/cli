import { Command, flags } from '@oclif/command';
import config, { Context } from '../../modules/config';
import cli from 'cli-ux';

export default class ListContexts extends Command {
  static description = 'Lists all configured contexts';

  static flags = {
    columns: flags.string({
      exclusive: ['additional'],
      description: 'only show provided columns (comma-seperated)',
    }),
    filter: flags.string({
      description:
        'filter property by partial string matching, ex: name=default',
    }),
    csv: flags.boolean({
      exclusive: ['no-truncate'],
      description: 'output is csv format',
    }),
    extended: flags.boolean({ char: 'x', description: 'show extra columns' }),
    'no-truncate': flags.boolean({
      exclusive: ['csv'],
      description: 'do not truncate output to fit screen',
    }),
    'no-header': flags.boolean({
      exclusive: ['csv'],
      description: 'hide table header from output',
    }),
  };

  async run() {
    const { flags } = this.parse(ListContexts);
    const contexts = config.get('contexts');
    const data = Object.keys(contexts).map((ctx) => ({
      name: ctx,
      ...contexts[ctx],
    }));

    const columns = {
      name: {
        minWidth: 10,
      },
      platformerAPIGateway: {
        header: 'API Gateway',
        extended: true,
      },
      'organization.name': {
        header: 'Default Organization',
        get: (row: Context) => row?.organization?.name || '-',
      },
      'project.name': {
        header: 'Default Project',
        get: (row: Context) => row?.project?.name || '-',
      },
    };

    cli.table(data, columns, flags);
  }
}
