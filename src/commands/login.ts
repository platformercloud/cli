import { Command } from "@oclif/command";
import { createServer } from "http";
import Conf from "conf";
import cli from "cli-ux";

const authURL = "http://beta.console.platformer.com";
const config = new Conf();

export default class Login extends Command {
  static description = "Log in to the CLI with your Platformer Account";

  async run() {
    const loginURL = new URL(`${authURL}/cli-login`);
    loginURL.searchParams.append("access_type", "offline");
    loginURL.searchParams.append("redirect_uri", "http://127.0.0.1:9999");
    loginURL.searchParams.append("response_type", "code");

    const server = createServer((req, res) => {
      const headers = {
        "Access-Control-Allow-Origin": "https://beta.console.platformer.com",
        "Access-Control-Allow-Methods": "OPTIONS, GET",
        "Access-Control-Allow-Headers": "*",
      };
      if (req.method === "OPTIONS") {
        res.writeHead(204, headers);
        return res.end();
      }
      const token = (req.headers["x-token"] as string)?.trim();
      if (token) {
        config.set("token", token);
      }
      res.writeHead(token ? 200 : 400, headers);
      res.end();
      server.emit("stop");
      return;
    });

    server.once("stop", () => server.close());
    server.listen(9999);

    cli.open(loginURL.href);
  }
}
