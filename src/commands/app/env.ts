import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultEnvironment, getDefaultOrganization, getDefaultProject } from '../../modules/config/helpers';
import { tryValidateCommonFlags } from '../../modules/util/validations';
import { getAppId, setAppEnv, SetAppEnv } from '../../modules/apps/app';
import { ensureTargetNamespace } from '../../modules/apps/environment';

export default class Init extends Command {
  static description =
    'Set environment for the app';

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
      description: 'Service Type (ClusterIP|NodePort|LoadBalancer)',
      required: false,
      multiple: false,
      default: 'ClusterIP'
    }),
    environment: flags.string({
      char: 'e',
      description: 'Environment Name',
      required: false,
      multiple: false,
      default: () => getDefaultEnvironment()?.name
    }),
    service: flags.string({
      char: 's',
      description: 'Service Account',
      required: false,
      multiple: false,
      default: 'default'
    }),
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
    replicas: flags.integer({
      char: 'r',
      description: 'Replica Count',
      required: false,
      multiple: false,
      default: 1
    }),
    graceful: flags.integer({
      char: 'g',
      description: 'Graceful Termination Seconds',
      required: false,
      multiple: false,
      default: 60
    }),
    deploy: flags.boolean({
      char: 'd',
      description: '[default: true] Auto Deploy (true|false)',
      required: false,
      // multiple: false,
      default: true
    }),
    // node: flags.string({
    //   char: 'x',
    //   description: 'Node Selector',
    //   required: false,
    //   multiple: false,
    //   default: {}
    // }),
    namespace: flags.string({
      char: 'z',
      description: 'Namespace',
      required: true,
      multiple: false
    })
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
    const { orgId, projectId, envId } = ctx;
    // cli.log(orgId, projectId, flags.appName);
    // await createApp({ name: flags.appName, orgId, projectId, type: flags.appType });
    const id = await getAppId({ projectId: projectId, orgId: orgId, name: flags.appName });
    await ensureTargetNamespace({ orgId, projectId, envId, name: flags.namespace });
    // eslint-disable-next-line no-unused-vars
    const data: SetAppEnv = {
      ID: id,
      orgId: orgId,
      projectId: projectId,
      envId: envId,
      auto_deploy: flags.deploy,
      service_account_name: flags.service,
      graceful_termination_seconds: flags.graceful,
      replicas: flags.replicas,
      namespace: flags.namespace,
      name: flags.appName,
      type: flags.appType
    };
    await setAppEnv(data);
    cli.log('App environment configured successfully');
  }
}
