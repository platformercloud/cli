import Command from '../base-command';
import { createServer } from 'http';
import { fetchPermanentToken } from '../modules/auth/token';
import config from '../modules/config';
import cli from 'cli-ux';
import * as chalk from 'chalk';

const consoleURL = 'https://console.dev.x.platformer.com';
const port = 9999;

export default class Login extends Command {
  static description =
    'Log in to the CLI with your Platformer Account (logs into the current context)';

  async run() {
    const loginURL = new URL(`${consoleURL}/cli-login`);
    loginURL.searchParams.append('access_type', 'offline');
    loginURL.searchParams.append('redirect_uri', `http://localhost:${port}`);
    loginURL.searchParams.append('response_type', 'code');

    const server = createServer(async (req, res) => {
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

      const currentContext: string = config.get('currentContext');
      const token = (req.headers['x-token'] as string)?.trim();
      if (!token) {
        config.set(`contexts.${currentContext}.auth.token`, null); // clear any existing token
        respondWithCORS(400);
        this.error(chalk.red('Failed to log in'), {
          exit: 1,
          suggestions: [
            'If you are using Safari, please try again with Chrome or Firefox',
          ],
        });
      }

      const permanentToken = await fetchPermanentToken(token);
      config.set(`contexts.${currentContext}.auth.token`, permanentToken);
      this.log(chalk.green('Successfully logged in!'));

      respondWithCORS(200);
      server.close();
      // eslint-disable-next-line unicorn/no-process-exit
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
