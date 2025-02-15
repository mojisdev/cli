import type { EmojiGroup } from "../types";
import { defineMojiAdapter } from "../adapter";
import { slugify } from "../utils";
import { fetchCache } from "../utils/cache";

function notImplemented(adapterFn: string) {
  return async () => {
    throw new Error(`the adapter function ${adapterFn} is not implemented`);
  };
}

export default defineMojiAdapter({
  name: "base",
  description: "base adapter",
  range: "*",
  groups: async ({ version, force }) => {
    if (version === "1.0" || version === "2.0" || version === "3.0") {
      console.warn(`version ${version} does not have group data`);
      return [];
    }

    const groups = await fetchCache(`https://unicode.org/Public/emoji/${version}/emoji-test.txt`, {
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

        return groups;
      },
      bypassCache: force,
    });

    return groups;
  },
  sequences: notImplemented("sequences"),
});
