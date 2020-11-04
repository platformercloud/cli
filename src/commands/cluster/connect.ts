import { Command, flags } from '@oclif/command';
import config from '../../modules/config';
import {
  kubectlIsInstalled,
  listClustersInKubeconfig,
} from '../../modules/mizzen/kubectl';
import * as inquirer from 'inquirer';
import { registerCluster } from '../../modules/mizzen/api';
import cli from 'cli-ux';
import { CLIError } from '@oclif/errors';

export default class ClusterConnect extends Command {
  static description = 'describe the command here';

  static flags = {
    help: flags.help({ char: 'h' }),
    organization: flags.string({
      char: 'o',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => config.get('organization.name') as string,
    }),
    project: flags.string({
      char: 'p',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => config.get('project.name') as string,
    }),
  };

  static args = [
    {
      name: 'cluster',
      description:
        '(OPTIONAL) Name of the Kubernetes Cluster to connect to the Platformer Console (must be a cluster name in your kubeconfig). If not provided, the CLI will enter an interactive mode to select a Cluster.',
      required: false,
    },
  ];

  async run() {
    const { flags, args } = this.parse(ClusterConnect);

    if (!flags.organization) {
      this.error('organization not set', {
        exit: 1,
        suggestions: [
          'Pass the organization name with --organization',
          'Set the organization with @TODO',
        ],
      });
    }
    if (!flags.project) {
      this.error('project not set', {
        exit: 1,
        suggestions: [
          'Pass the project name with --project',
          'Set the project with @TODO',
        ],
      });
    }

    if (!(await kubectlIsInstalled())) {
      this.error('kubectl binary not found.', {
        exit: 1,
        suggestions: ['Install kubectl', 'Ensure kubectl is in your $PATH'],
      });
    }

    const clusterList = await listClustersInKubeconfig();

    if (args.cluster && !clusterList.includes(args.cluster)) {
      return this.error(
        `The cluster "${args.cluster}" was not found in your kubeconfig.`,
        {
          exit: 1,
          suggestions: [
            'Verify the cluster name with $ kubectl config get-clusters',
            'Select a cluster through this CLI interactively (omit the CLUSTER argument)',
          ],
        }
      );
    }

    if (!args.cluster) {
      const { cluster } = await inquirer.prompt([
        {
          name: 'cluster',
          message: 'Select a Cluster to connect to the Platformer Console',
          type: 'list',
          choices: clusterList,
        },
      ]);
      args.cluster = cluster;
    }

    try {
      const response = await registerCluster(
        flags.organization,
        flags.project,
        args.cluster
      );
      console.log('res', response);
    } catch (err) {
      this.error('Failed to register the Cluster', {
        exit: 1,
        suggestions: [
          'Make sure there no other Clusters with the same name in the same Project',
          'Connect this Cluster from the Platformer Console',
        ],
        ref: 'https://docs.platformer.com/03-clusters/03-connecting-clusters/',
      });
    }

    this.log('flags', flags);
  }
}
