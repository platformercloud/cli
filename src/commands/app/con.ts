import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultEnvironment, getDefaultOrganization, getDefaultProject } from '../../modules/config/helpers';
import { tryValidateCommonFlags } from '../../modules/util/validations';
import { AppCreateContainer, createAppContainer, getAppEnvId, getAppId } from '../../modules/apps/app';

export default class Con extends Command {
  static description =
    'Create container for the app';

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
      description: 'App Type (MAIN|INIT|SIDECAR)',
      required: false,
      multiple: false,
      default: 'MAIN'
    }),
    environment: flags.string({
      char: 'e',
      description: 'Environment Name',
      required: false,
      multiple: false,
      default: () => getDefaultEnvironment()?.name
    }),
    cpu: flags.integer({
      char: 'c',
      description: 'CPU',
      required: false,
      multiple: false,
      default: 50
    }),
    memory: flags.integer({
      char: 'm',
      description: 'Memory',
      required: false,
      multiple: false,
      default: 128
    })
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
    const { flags } = this.parse(Con);
    const context = await tryValidateCommonFlags({
      organization: {
        name: flags.organization,
        required: true
      },
      project: {
        name: flags.project,
        required: true
      }
      ,
      environment: {
        name: flags.environment,
        required: true
      }
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
    const id = await getAppId({ projectId: projectId, orgId: orgId, name: flags.appName });
    const envId = await getAppEnvId({ projectId: projectId, orgId: orgId, name: flags.appName });
    // if (!env) {
    //   return cli.log('Please Set App Environment');
    // }
    const data: AppCreateContainer = {
      ID: id,
      name: flags.appName,
      orgId: orgId,
      projectId: projectId,
      envId: envId,
      type: flags.appType,
      cpu: flags.cpu,
      memory: flags.memory
    };
    // cli.log(orgId, projectId, flags.appName, flags.appType);
    await createAppContainer(data);
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
