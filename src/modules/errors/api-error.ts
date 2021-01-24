import { Response } from 'node-fetch';
import { PrettyPrintableError } from '@oclif/errors';

export default class APIError extends Error {
  constructor(
    message: string,
    public response: Response,
    public oclifErrorOptions?: PrettyPrintableError
  ) {
    super(message);
  }

  get statusCode() {
    return this.response.status;
  }
  async data() {
    try {
      return await this.response.json();
    } catch (error) {
      return null;
    }
  }
}
