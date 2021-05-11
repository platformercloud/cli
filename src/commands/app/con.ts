import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultEnvironment } from '../../modules/config/helpers';
import { ValidateEnvironment } from '../../modules/util/validations';
import {
  AppCreateContainer,
  AppPort,
  createAppContainer,
  getApp,
  getAppEnvId,
} from '../../modules/apps/app';
import { validateContainerName } from '../../modules/util/rudder_validations';
import { readFile } from '../../modules/apps/files';

export default class Con extends Command {
  static description = 'Create container for the app';

  static flags = {
    help: flags.help({ char: 'h' }),
    containerName: flags.string({
      char: 'c',
      description: 'Container Name',
      required: true,
      multiple: false,
    }),
    appType: flags.string({
      char: 't',
      description: 'App Type (MAIN|INIT|SIDECAR)',
      required: false,
      multiple: false,
      default: 'MAIN',
    }),
    environment: flags.string({
      char: 'e',
      description: 'Environment Name',
      required: false,
      multiple: false,
      default: () => getDefaultEnvironment()?.name,
    }),
    cpu: flags.integer({
      char: 'u',
      description: 'CPU',
      required: false,
      multiple: false,
      default: 50,
    }),
    memory: flags.integer({
      char: 'm',
      description: 'Memory',
      required: false,
      multiple: false,
      default: 128,
    }),
    port: flags.integer({
      char: 'q',
      description: 'Port',
      required: false,
      multiple: true,
      default: 8080,
    }),
  };

  async run() {
    const { flags } = this.parse(Con);
    cli.action.start('Creating container for app');
    const fileData = readFile();
    const context = await ValidateEnvironment(
      fileData.orgId,
      fileData.projectId,
      flags.environment
    );
    const ctx = context as Required<typeof context>;
    const { envId } = ctx;
    const app = await getApp({
      projectId: fileData.projectId,
      orgId: fileData.orgId,
      name: fileData.name,
    });
    if (!app) {
      throw new Error('App not found');
    }
    const appEnvId = await getAppEnvId(app, envId);
    if (!appEnvId) {
      throw new Error('Please Set App Environment');
    }
    if (flags.cpu > 4000) {
      throw new Error('Maximum CPU size is 4000');
    }
    if (flags.memory > 3096) {
      throw new Error('Maximum memory size is 3096');
    }
    if (flags.cpu < 50) {
      throw new Error('Minimum CPU size is 50');
    }
    if (flags.memory < 128) {
      throw new Error('Minimum memory size is 128');
    }
    if (!flags.appType.toUpperCase().match(/^(MAIN|INIT|SIDECAR)$/)) {
      throw new Error('Wrong app type, it must be MAIN,INIT or SIDECAR');
    }
    validateContainerName(flags.containerName);
    const portSet = portObjArr(flags.port);
    const data: AppCreateContainer = {
      ID: app.ID,
      name: flags.containerName,
      orgId: fileData.orgId,
      projectId: fileData.projectId,
      appEnvId: appEnvId,
      type: flags.appType.toUpperCase(),
      cpu: flags.cpu,
      memory: flags.memory,
      port: portSet,
    };
    await createAppContainer(data);
    cli.action.stop('\nApp Container created successfully');
  }
}

function portObjArr(a: number[] | number): AppPort[] {
  if (!Array.isArray(a)) {
    return [
      {
        port: a,
        protocol: 'TCP',
        service_port: a,
      },
    ];
  }
  return a.map((c) => {
    return {
      port: c,
      protocol: 'TCP',
      service_port: c,
    };
  });
}
