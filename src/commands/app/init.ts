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
    });
    const ctx = context as Required<typeof context>;
    const { orgId, projectId } = ctx;
    await createApp({ name: flags.appName, orgId, projectId, type: flags.appType });
    cli.log('App Created successfully');
  }
}
