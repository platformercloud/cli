import { flags } from '@oclif/command';
import { ConnectedCluster, listClusters } from '../../modules/mizzen/api';
import {
  getDefaultOrganization,
  getDefaultProject,
} from '../../modules/config/helpers';
import { validateAndGetOrganizationId } from '../../modules/auth/organization';
import { validateAndGetProjectId } from '../../modules/auth/project';
import Command from '../../base-command';
import cli from 'cli-ux';
import chalk = require('chalk');

export default class ClusterList extends Command {
  static description = 'Lists all connected Kubernetes Clusters in a Project';

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
    const { flags } = this.parse(ClusterList);
    if (!flags.organization) {
      this.error('organization not set', {
        exit: 1,
        suggestions: [
          'Pass the organization name with --organization',
          'Set the default organization with select:organization',
        ],
      });
    }
    if (!flags.project) {
      this.error('project not set', {
        exit: 1,
        suggestions: [
          'Pass the project name with --project',
          'Set the default project with platformer select:project',
        ],
      });
    }

    const orgId = await validateAndGetOrganizationId(flags.organization);
    const projectId = await validateAndGetProjectId(orgId, flags.project);

    const columns = {
      name: {
        minWidth: 20,
      },
      status: {
        get: (row: ConnectedCluster) => {
          if (row.upgradeInProgress) {
            return chalk.grey('Upgrading Agent');
          }
          return row.isActive
            ? chalk.green('Connected')
            : chalk.red('Disconnected');
        },
      },
      notifications: {
        extended: true,
        get: (row: ConnectedCluster) => {
          if (row.upgradeAvailable) {
            return `Upgrade agent to ${row.upgradeAvailable}`;
          }
          return '-';
        },
      },
      lastConnected: {
        header: 'Last connection established on',
        extended: true,
      },
      lastDisconnected: {
        header: 'Last disconnected',
        extended: true,
      },
    };
    const clusters = await listClusters(orgId, projectId);
    cli.table(clusters, columns, flags);
  }
}
