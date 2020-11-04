import { Command, flags } from "@oclif/command";
import Conf from "conf";

const config = new Conf();

export default class Org extends Command {
  static description = "select org";

  static examples = [
    `$ pctl org
org world from ./src/hello.ts!
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  };

  static args = [{ name: "file" }];

  async run() {
    const { args, flags } = this.parse(Org);

    console.log("config", config.get("token"));

    const name = flags.name ?? "world";
    this.log(`org select`);
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }
  }
}
