import { PrettyPrintableError } from '@oclif/errors';
import * as chalk from 'chalk';

export default class ValidationError extends Error {
  constructor(
    message: string,
    public oclifErrorOptions?: PrettyPrintableError
  ) {
    super(chalk.red(message));
  }
}
