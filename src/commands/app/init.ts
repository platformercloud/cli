import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultOrganization, getDefaultProject } from '../../modules/config/helpers';
import { tryValidateCommonFlags } from '../../modules/util/validations';
import { createApp } from '../../modules/apps/app';

export default class Init extends Command {
  static description =
    'Create a app in Platformer Console';

  static flags = {
    help: flags.help({ char: 'h' }),
    // save: flags.boolean(),
    // all: flags.boolean({
    //   char: 'A',
    //   description: 'Log out of all contexts',
    //   required: false,
    //   exclusive: ['context']
    // }),
    organization: flags.string({
      char: 'o',
      description: 'Organization Name',
      required: false,
      multiple: false,
      default: () => getDefaultOrganization()?.name
    }),
    project: flags.string({
      char: 'p',
      description: 'Project Name',
      required: false,
      multiple: false,
      default: () => getDefaultProject()?.name
    }),
    appName: flags.string({
      char: 'n',
      description: 'App Name',
      required: true,
      multiple: false
    }),
    appType: flags.string({
      char: 't',
      description: 'App Type (Deployment|Job|CronJob|StatefulSet|DaemonSet)',
      required: true,
      multiple: false
    })
    // environment: flags.string({
    //   char: 'e',
    //   description: 'Environment Name',
    //   required: false,
    //   multiple: false,
    //   default: () => getDefaultEnvironment()?.name
    // }),
    // 'target-ns': flags.string({
    //   char: 't',
    //   description: 'Target namespace',
    //   required: false,
    //   multiple: false
    // }),
    // 'filepath': flags.string({
    //   char: 'f',
    //   description: 'Path to YAML file',
    //   required: true,
    //   multiple: false
    // })
  };

  async run() {
    const { flags } = this.parse(Init);
    const context = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true
      },
      project: {
        name: flags.project,
        required: true
      }
      // ,
      // environment: {
      //   name: flags.environment,
      //   required: true
      // }
    });
    const ctx = context as Required<typeof context>;
    // const fileFolderPath = flags['filepath'];
    // const targetNS = flags['target-ns'];
    // const { orgId, projectId, envId } = ctx;
    // if (targetNS) {
    //   cli.log(`Target namespace [${targetNS}]`);
    //   await ensureTargetNamespace({ orgId, projectId, envId, name: targetNS });
    // }
    const { orgId, projectId } = ctx;
    // cli.log(orgId, projectId, flags.appName, flags.appType);
    await createApp({ name: flags.appName, orgId, projectId, type: flags.appType });
    cli.log('App Created successfully');
  }
}

/*
export interface Application {
  ID: string;
  name: string;
  organization_id: string;
  project_id: string;
  type: string;
  // app_environments: AppEnvironment[] | null;
  // metadata: Record<string, string> | null;
  // CreatedAt: string;
  // DeletedAt: string | null;
  // UpdatedAt: string;
}
*/
