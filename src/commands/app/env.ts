import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultEnvironment } from '../../modules/config/helpers';
import { ValidateEnvironment } from '../../modules/util/validations';
import { getApp, setAppEnv, SetAppEnv } from '../../modules/apps/app';
import { ensureTargetNamespace } from '../../modules/apps/environment';
import ValidationError from '../../modules/errors/validation-error';
import { getDefaultAppName, getDefaultOrganizationIdFile, getDefaultProjectIdFile } from '../../modules/apps/files';

export default class Init extends Command {
  static description =
    'Set environment for the app';

  static flags = {
    help: flags.help({ char: 'h' }),
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
      default: true
    }),
    namespace: flags.string({
      char: 'z',
      description: 'Namespace',
      required: true,
      multiple: false
    })
  };

  async run() {
    const { flags } = this.parse(Init);
    cli.action.start('Configuring environment for app');
    if (!flags.appType.match(/^(ClusterIP|NodePort|LoadBalancer)$/)) {
      throw new Error('Wrong app type, it must be ClusterIP,NodePort or LoadBalancer');
    }
    const projectId = getDefaultProjectIdFile();
    const orgId = getDefaultOrganizationIdFile();
    const appName = getDefaultAppName();
    const context = await ValidateEnvironment(orgId, projectId, flags.environment);
    const ctx = context as Required<typeof context>;
    const { envId } = ctx;
    const app = await getApp({ projectId: projectId, orgId: orgId, name: appName! });
    if (!app) {
      throw new Error('App not found');
    }
    if (app.app_environments?.some(a => a.environment_id === envId)) {
      throw new ValidationError('App environment already initialized');
    }
    await ensureTargetNamespace({ orgId, projectId, envId, name: flags.namespace });
    const data: SetAppEnv = {
      ID: app.ID,
      orgId: orgId,
      projectId: projectId,
      envId: envId,
      auto_deploy: flags.deploy,
      service_account_name: flags.service,
      graceful_termination_seconds: flags.graceful,
      replicas: flags.replicas,
      namespace: flags.namespace,
      name: appName!,
      type: flags.appType
    };
    await setAppEnv(data);
    cli.action.stop('\nApp environment configured successfully');
  }
}
