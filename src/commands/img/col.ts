import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import Command from '../../base-command';
import { getDefaultOrganization, getDefaultProject } from '../../modules/config/helpers';
import { tryValidateCommonFlags } from '../../modules/util/validations';
import { createImageCollection } from '../../modules/image/image';

export default class Col extends Command {
  static description =
    'Create a image in Platformer Console';

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
      description: 'Collection Name',
      required: true,
      multiple: false
    }),
    appType: flags.boolean({
      char: 't',
      description: '[default: true] Image Collection Type (true|false)',
      required: false,
      // multiple: false,
      default: true
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
    const { flags } = this.parse(Col);
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
    cli.log(orgId, projectId, flags.appName, String(flags.appType));
    await createImageCollection({ name: flags.appName, orgId, projectId, type: flags.appType });
    cli.log('Image Collection Create successfully');
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
