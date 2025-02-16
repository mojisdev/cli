import type { EmojiGroup, EmojiMetadata } from "../types";
import { red } from "farver/fast";
import { defineMojiAdapter } from "../adapter";
import { extractEmojiVersion, extractUnicodeVersion, slugify } from "../utils";
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
  metadata: async (ctx) => {
    if (ctx.version === "1.0" || ctx.version === "2.0" || ctx.version === "3.0") {
      console.warn(`version ${ctx.version} does not have group data`);
      return {
        groups: [],
        emojiMetadata: {},
      };
    }

    return fetchCache(`https://unicode.org/Public/emoji/${ctx.version}/emoji-test.txt`, {
      cacheKey: `v${ctx.version}/metadata.json`,
      parser(data) {
        const lines = data.split("\n");
        let currentGroup: EmojiGroup | undefined;

        const groups: EmojiGroup[] = [];

        // [group-subgroup][hexcode] = metadata
        const emojiMetadata: Record<string, Record<string, EmojiMetadata>> = {};

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

            continue;
          } else if (line.startsWith("# subgroup:")) {
            const subgroupName = line.slice(11).trim();

            if (currentGroup == null) {
              throw new Error(`subgroup ${subgroupName} without group`);
            }

            currentGroup.subgroups.push(slugify(subgroupName));

            continue;
          } else if (line.startsWith("#")) {
            continue;
          }

          const [baseHexcode, trailingLine] = line.split(";");

          if (baseHexcode == null || trailingLine == null) {
            throw new Error(`invalid line: ${line}`);
          }

          const [baseQualifier, comment] = trailingLine.split("#");

          if (baseQualifier == null || comment == null) {
            throw new Error(`invalid line: ${line}`);
          }

          const hexcode = baseHexcode.trim().replace(/\s+/g, "-");
          const qualifier = baseQualifier.trim();

          const emojiVersion = extractEmojiVersion(comment.trim());
          const [emoji, trimmedComment] = comment.trim().split(` E${emojiVersion} `);

          const groupName = currentGroup?.slug ?? "unknown";
          const subgroupName = currentGroup?.subgroups[currentGroup.subgroups.length - 1] ?? "unknown";

          const metadataGroup = `${groupName}-${subgroupName}`;

          if (emojiMetadata[metadataGroup] == null) {
            emojiMetadata[metadataGroup] = {};
          }

          emojiMetadata[metadataGroup][hexcode] = {
            group: groupName,
            subgroup: subgroupName,
            qualifier,
            emojiVersion: emojiVersion || null,
            // TODO: use correct unicode version
            unicodeVersion: extractUnicodeVersion(emojiVersion, "16.0"),
            description: trimmedComment || "",
            emoji: emoji || null,
            hexcodes: hexcode.split("-"),
          };
        }

        return {
          groups,
          emojiMetadata,
        };
      },
      bypassCache: ctx.force,
    });
  },
  sequences: notImplemented("sequences"),
  emojis: notImplemented("emojis"),
  variations: notImplemented("variations"),
  shortcodes: notImplemented("shortcodes"),
});
