import { Command as OCLIFCommand } from '@oclif/command';
import config from './modules/config';
import APIError from './modules/errors/api-error';
import ValidationError from './modules/errors/validation-error';
import {
  reportWithScope,
  waitForSentryCompletion,
} from './modules/sentry/sentry';
import { writeHAR } from './modules/util/fetch';
import { cli } from 'cli-ux';

export default abstract class Command extends OCLIFCommand {
  async init() {
    this.debug('Using config:', config.path);
  }

  async catch(error: Error) {
    // Handle custom errors globally
    switch (error.constructor) {
      case APIError: {
        const e = error as APIError;
        cli.log(await e.data())
        if (e.statusCode === 401) {
          return this.error('You are not logged in', {
            exit: 1,
            code: '401 Unauthorized',
            suggestions: [
              'Log into your Platformer Account using `$ platformer login`',
            ],
          });
        }
        return this.error(e.message, { exit: 1, ...e.oclifErrorOptions });
      }
      case ValidationError: {
        const e = error as ValidationError;
        return this.error(e.message, { exit: 1, ...e.oclifErrorOptions });
      }
      default: {
        reportWithScope(error);
        return super.catch(error);
      }
    }
  }
  async finally(_: Error | undefined) {
    writeHAR();
    await waitForSentryCompletion();
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}
