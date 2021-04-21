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
    }),
    port: flags.integer({
      char: 'q',
      description: 'Port',
      required: false,
      multiple: false,
      default: 8080
    })
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
    const { orgId, projectId, envId } = ctx;
    const id = await getAppId({ projectId: projectId, orgId: orgId, name: flags.appName });
    const appEnvId = await getAppEnvId({ projectId: projectId, orgId: orgId, name: flags.appName }, envId);
    const data: AppCreateContainer = {
      ID: id,
      name: flags.appName,
      orgId: orgId,
      projectId: projectId,
      envId: appEnvId,
      type: flags.appType,
      cpu: flags.cpu,
      memory: flags.memory,
      port: flags.port
    };
    await createAppContainer(data);
    cli.log('App Created successfully');
  }
}
