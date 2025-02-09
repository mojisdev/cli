import process from "node:process";
import { green, red, yellow } from "farver/fast";
import fs from "fs-extra";
import yargs, { type Argv } from "yargs";
import pkg from "../package.json" with { type: "json" };
import { fetchCache } from "./cache";
import { SUPPORTED_EMOJI_VERSIONS } from "./constants";
import { getGroups } from "./groups";
import { readLockfile, writeLockfile } from "./lockfile";
import { getAllEmojiVersions } from "./utils";

const cli = yargs(process.argv.slice(2))
  .scriptName("mojis")
  .usage("$0 [args]")
  .version(pkg.version ?? "0.0.0")
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

cli.command(
  "versions:latest",
  "Check for the latest emoji versions",
  (args) => commonOptions(args)
    .option("write-lockfile", {
      type: "boolean",
      default: false,
      description: "write the latest version to the lockfile",
    })
    .strict().help(),
  async (args) => {
    const versions = await getAllEmojiVersions();

    const latest = versions[0];

    console.log("latest emoji version:", yellow(latest?.emoji_version));

    if (args.writeLockfile) {
      const lockfile = await readLockfile();

      lockfile.latestVersion = latest?.emoji_version;

      await writeLockfile(lockfile);
      console.log(`updated ${yellow("emojis.lock")}`);
    }
  },
);

cli.command(
  "versions",
  "Print all emoji versions available",
  (args) => commonOptions(args)
    .option("write-lockfile", {
      type: "boolean",
      default: false,
      description: "update the lockfile with the available versions",
    }).strict().help(),
  async (args) => {
    const versions = await getAllEmojiVersions();

    console.log("all available versions:");
    console.log(versions.map((v) => `${yellow(v.emoji_version)}${v.draft ? ` ${red("(draft)")}` : ""}`).join(", "));

    if (args.writeLockfile) {
      const lockfile = await readLockfile();

      lockfile.versions = Array.from(versions);

      await writeLockfile(lockfile);
      console.log(`updated ${yellow("emojis.lock")}`);
    }
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
