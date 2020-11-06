import { PrettyPrintableError } from '@oclif/errors';

export default class ValidationError extends Error {
  constructor(
    message: string,
    public oclifErrorOptions?: PrettyPrintableError
  ) {
    super(message);
  }
}
