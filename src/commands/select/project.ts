import { Command, flags } from '@oclif/command';
import config from '../../modules/config';

export default class Project extends Command {
  static description = 'Select project';

  run(): PromiseLike<any> {
    const { args, flags } = this.parse(Project);


    return Promise.resolve(undefined);
  }
}
