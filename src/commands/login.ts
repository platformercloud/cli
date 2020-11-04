import { Command } from '@oclif/command';
import { createServer } from 'http';
import config from '../modules/config';
import cli from 'cli-ux';
import * as chalk from 'chalk';

const consoleURL = 'https://beta.console.platformer.com';
const port = 9999;

export default class Login extends Command {
  static description = 'Log in to the CLI with your Platformer Account';

  async run() {
    const loginURL = new URL(`${consoleURL}/cli-login`);
    loginURL.searchParams.append('access_type', 'offline');
    loginURL.searchParams.append('redirect_uri', `http://127.0.0.1:${port}`);
    loginURL.searchParams.append('response_type', 'code');

    const server = createServer((req, res) => {
      const respondWithCORS = (statusCode: number) => {
        res.writeHead(statusCode, {
          'Access-Control-Allow-Origin': consoleURL,
          'Access-Control-Allow-Methods': 'OPTIONS, GET',
          'Access-Control-Allow-Headers': '*',
        });
        res.end();
      };

      if (req.method === 'OPTIONS') {
        return respondWithCORS(204);
      }

      const token = (req.headers['x-token'] as string)?.trim();
      if (!token) {
        config.set({ auth: { token: '' } }); // Clear any existing token
        respondWithCORS(400);
        this.error(chalk.red('Error: Failed to log in'), {
          exit: 1,
        });
      }
      config.set({ auth: { token } });
      this.log(chalk.green('Successfully logged in!'));
      respondWithCORS(200);

      server.close();
      process.exit(0);
    }).listen(port);

    this.log(chalk.blueBright('You will now be redirected to your browser...'));
    await cli.open(loginURL.href);
    this.log(
      chalk.grey(
        'If you are not redirected to your browser automatically, please open this link:',
        loginURL.href
      )
    );
  }
}
