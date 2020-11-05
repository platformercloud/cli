import { Command, flags } from '@oclif/command';
import config from '../../modules/config';
import {
  installAgent,
  kubectlIsInstalled,
  listClustersInKubeconfig,
} from '../../modules/mizzen/kubectl';
import * as inquirer from 'inquirer';
import {
  generateAgentInstallationLink,
  registerCluster,
} from '../../modules/mizzen/api';
import cli from 'cli-ux';
import chalk = require('chalk');
import {
  getDefaultOrganization,
  getDefaultProject,
} from '../../modules/config/helpers';
import { validateAndGetOrganizationId } from '../../modules/auth/organization';
import { validateAndGetProjectId } from '../../modules/auth/project';

export default class ClusterConnect extends Command {
  static description =
    'Connect a Kubernetes Cluster (in your kubeconfig) to the Platformer Console';

  static examples = [
    '$ platormer connect:cluster',
    '$ platormer connect:cluster <cluster-name as listed in your kubeconfig>',
    '$ platormer connect:cluster -o=<organization> -p=<project> # override context defaults',
  ];

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
        projectId,
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
    } catch (err) {
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
