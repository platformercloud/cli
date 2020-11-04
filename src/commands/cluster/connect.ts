import { Command, flags } from '@oclif/command';
import config from '../../modules/config';
import {
  kubectlIsInstalled,
  listClustersInKubeconfig,
} from '../../modules/mizzen/kubectl';
import * as inquirer from 'inquirer';
import cli from 'cli-ux';

export default class ClusterConnect extends Command {
  static description = 'describe the command here';

  static flags = {
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
    cluster: flags.string({
      char: 'c',
      description:
        'Name of the Kubernetes Cluster to connect to the Platformer Console (must be a cluster name in your kubeconfig). If not provided, the CLI will enter an interactive mode to select a Cluster.',
      required: false,
      multiple: false,
    }),
  };

  async run() {
    const { flags } = this.parse(ClusterConnect);
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
    if (flags.cluster) {
    }

    const { cluster } = await inquirer.prompt([
      {
        name: 'cluster',
        message: 'Select a Cluster to connect to the Platformer Console',
        type: 'list',
        choices: clusterList,
      },
    ]);

    console.log(cluster);
    this.log('flags', flags);
  }
}
