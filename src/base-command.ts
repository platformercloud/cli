import { Command as OCLIFCommand } from '@oclif/command';
import APIError from './modules/errors/api-error';

export default abstract class Command extends OCLIFCommand {
  async catch(error: Error) {
    // Handle custom errors globally
    switch (error.constructor) {
      case APIError: {
        const e = <APIError>error;
        if (e.statusCode === 401) {
          return this.error('You are not logged in', {
            exit: 1,
            code: '401 Unauthorized',
            suggestions: [
              'Log into your Platformer Account using `$ platformer login`',
            ],
          });
        }
        return this.error(e.message, e.oclifErrorOptions);
      }
      default:
        return super.catch(error);
    }
  }
  async finally(_: Error | undefined) {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}
