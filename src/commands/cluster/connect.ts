import { flags } from '@oclif/command';
import {
  installAgent,
  kubectlIsInstalled,
  listClustersInKubeconfig,
} from '../../modules/cluster/kubectl';
import * as inquirer from 'inquirer';
import {
  generateAgentInstallationLink,
  registerCluster,
} from '../../modules/cluster/api';
import cli from 'cli-ux';
import chalk = require('chalk');
import {
  getDefaultOrganization,
  getDefaultProject,
} from '../../modules/config/helpers';
import Command from '../../base-command';
import { tryValidateCommonFlags } from '../../modules/util/validations';

export default class ClusterConnect extends Command {
  static description =
    'Connect a Kubernetes Cluster (in your kubeconfig) to the Platformer Console';

  static examples = [
    '$ platformer connect:cluster',
    '$ platformer connect:cluster <cluster-name as listed in your kubeconfig>',
    '$ platformer connect:cluster --organization <organization> --project <project> # override context defaults',
  ];

  static flags = {
    help: flags.help({ char: 'h' }),
    organization: flags.string({
      char: 'O',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => getDefaultOrganization()?.name,
    }),
    project: flags.string({
      char: 'P',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => getDefaultProject()?.name,
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
    const { orgId, projectId } = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true,
      },
      project: {
        name: flags.project,
        required: true,
      },
    });

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
      cli.action.start(
        'Please wait',
        'Registering your Cluster with Platformer'
      );
      const credentials = await registerCluster(
        orgId,
        projectId!,
        args.cluster
      );
      cli.action.start('Please wait', 'Installing the Platformer Agent');
      const output = await installAgent(
        args.cluster,
        generateAgentInstallationLink(credentials)
      );
      cli.action.stop();
      this.log(chalk.green(`Successfully connected "${args.cluster}"`));
      this.debug(output);
    } catch (error) {
      cli.action.stop();
      this.error('Failed to register the Cluster', {
        exit: 1,
        suggestions: [
          'Make sure there no other Clusters with the same name in the same Project',
          'Connect this Cluster from the Platformer Console',
        ],
        ref: 'https://docs.platformer.com/03-clusters/03-connecting-clusters/',
      });
    }
  }
}
