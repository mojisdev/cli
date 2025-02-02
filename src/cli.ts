import process from "node:process";
import { green, red, yellow } from "farver/fast";
import fs from "fs-extra";
import yargs, { type Argv } from "yargs";
import { version } from "../package.json" with { type: "json" };
import { fetchCache } from "./cache";
import { SUPPORTED_EMOJI_VERSIONS } from "./constants";
import { getGroups } from "./groups";

const cli = yargs(process.argv.slice(2))
  .scriptName("mojis")
  .usage("$0 [args]")
  .version(version)
  .strict()
  .showHelpOnFail(true)
  .alias("h", "help")
  .alias("v", "version")
  .demandCommand(1, "");

cli.command(
  "generate:emoji <versions...>",
  "Generate emoji data for the specified versions",
  (args) => commonOptions(args)
    .positional("versions", {
      type: "string",
      description: "emoji versions to generate",
    })
    .strict().help(),
  async (args) => {
    const _force = args.force ?? false;
    const versions = Array.isArray(args.versions) ? args.versions : [args.versions];

    if (SUPPORTED_EMOJI_VERSIONS.every((v) => !versions.includes(v))) {
      console.error(red("error:"), "unsupported emoji versions");
      console.log("supported versions:", SUPPORTED_EMOJI_VERSIONS.join(", "));
      process.exit(1);
    }

    console.log("generating emoji data for versions", versions.map((v) => yellow(v)).join(", "));
  },
);

cli.command(
  "generate:groups <versions...>",
  "Generate emoji group data for the specified versions",
  (args) => commonOptions(args)
    .positional("versions", {
      type: "string",
      description: "emoji versions to generate",
    })
    .strict().help(),
  async (args) => {
    const force = args.force ?? false;
    const versions = Array.isArray(args.versions) ? args.versions : [args.versions];

    if (SUPPORTED_EMOJI_VERSIONS.every((v) => !versions.includes(v))) {
      console.error(red("error:"), "unsupported emoji versions");
      console.log("supported versions:", SUPPORTED_EMOJI_VERSIONS.join(", "));
      process.exit(1);
    }

    console.log("generating emoji group data for versions", versions.map((v) => yellow(v)).join(", "));

    const promises = versions.map(async (version) => {
      const groups = await fetchCache(`https://unicode.org/Public/emoji/${version}/emoji-test.txt`, {
        cacheKey: `v${version}/metadata.json`,
        parser(data) {
          return getGroups(data);
        },
        bypassCache: force,
      });

      await fs.ensureDir(`./data/v${version}`);

      return fs.writeFile(`./data/v${version}/groups.json`, JSON.stringify(groups, null, 2), "utf-8");
    });

    const results = await Promise.allSettled(promises);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(red("error:"), result.reason);
      }
    }

    console.log(green("done"));
  },
);

cli.help().parse();

function commonOptions(args: Argv<object>): Argv<object & { force: boolean }> {
  return args.option("force", {
    type: "boolean",
    description: "bypass cache",
    default: false,
  });
}
