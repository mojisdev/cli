import type { EmojiGroup } from "../types";
import { red } from "farver/fast";
import { defineMojiAdapter } from "../adapter";
import { slugify } from "../utils";
import { fetchCache } from "../utils/cache";
import { MojisNotImplemented } from "../utils/errors";

function notImplemented(adapterFn: string) {
  return async () => {
    throw new MojisNotImplemented(`the adapter function ${red(adapterFn)} is not implemented`);
  };
}

export default defineMojiAdapter({
  name: "base",
  description: "base adapter",
  range: "*",
  metadata: async ({ version, force }) => {
    if (version === "1.0" || version === "2.0" || version === "3.0") {
      console.warn(`version ${version} does not have group data`);
      return {
        groups: [],
      };
    }

    return fetchCache(`https://unicode.org/Public/emoji/${version}/emoji-test.txt`, {
      cacheKey: `v${version}/metadata.json`,
      parser(data) {
        const lines = data.split("\n");
        let currentGroup: EmojiGroup | undefined;

        const groups: EmojiGroup[] = [];

        for (const line of lines) {
          if (line.trim() === "") {
            continue;
          }

          if (line.startsWith("# group:")) {
            const groupName = line.slice(8).trim();

            const group: EmojiGroup = {
              name: groupName,
              slug: slugify(groupName),
              subgroups: [],
            };

            currentGroup = group;

            groups.push(group);
          } else if (line.startsWith("# subgroup:")) {
            const subgroupName = line.slice(11).trim();

            if (currentGroup == null) {
              throw new Error(`subgroup ${subgroupName} without group`);
            }

            currentGroup.subgroups.push(subgroupName);
          }
        }

        return {
          groups,
        };
      },
      bypassCache: force,
    });
  },
  sequences: notImplemented("sequences"),
  emojis: notImplemented("emojis"),
  variations: notImplemented("variations"),
  shortcodes: notImplemented("shortcodes"),
});
