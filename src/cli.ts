import cac from "cac";
import { version } from "../package.json";

const cli = cac("mojis");

cli
  .command("check:version", "check the latest version of unicode emojis")
  .action(async (args) => {
    console.log("Checking the latest version of unicode emojis...", args);
  });

cli.help();
cli.version(version);

cli.parse();
