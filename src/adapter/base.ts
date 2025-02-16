import type { EmojiGroup, EmojiMetadata } from "../types";
import consola from "consola";
import { red, yellow } from "farver/fast";
import { defineMojiAdapter, MojisNotImplemented } from "../adapter";
import { extractEmojiVersion, extractUnicodeVersion, slugify } from "../utils";
import { fetchCache } from "../utils/cache";

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
    if (ctx.emojiVersion === "1.0" || ctx.emojiVersion === "2.0" || ctx.emojiVersion === "3.0") {
      consola.warn(`skipping metadata for emoji version ${yellow(ctx.emojiVersion)}, as it's not supported.`);
      return {
        groups: [],
        emojiMetadata: {},
      };
    }

    return fetchCache(`https://unicode.org/Public/emoji/${ctx.emojiVersion}/emoji-test.txt`, {
      cacheKey: `v${ctx.emojiVersion}/metadata.json`,
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
            unicodeVersion: extractUnicodeVersion(emojiVersion, ctx.unicodeVersion),
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
  unicodeNames: async (ctx) => {
    return fetchCache(`https://unicode.org/Public/${ctx.emojiVersion}.0/ucd/UnicodeData.txt`, {
      cacheKey: `v${ctx.emojiVersion}/unicode-names.json`,
      parser(data) {
        const lines = data.split("\n");
        const unicodeNames: Record<string, string> = {};

        for (const line of lines) {
          if (line.trim() === "" || line.startsWith("#")) {
            continue;
          }

          const [hex, name] = line.split(";").map((col) => col.trim());

          if (hex == null || name == null) {
            throw new Error(`invalid line: ${line}`);
          }

          unicodeNames[hex] = name;
        }

        return unicodeNames;
      },
      bypassCache: ctx.force,
    });
  },
});
