import type { EmojiSequence, EmojiVariation } from "../types";
import { defineMojiAdapter } from "../adapter";
import { FEMALE_SIGN, MALE_SIGN } from "../constants";
import { fetchCache } from "../utils/cache";
import { expandHexRange } from "../utils/hexcode";

export default defineMojiAdapter({
  name: "v16",
  description: "adapter for version 16",
  range: ">=16.0.0 <17.0.0",
  extend: "base",
  sequences: async (ctx) => {
    const [sequences, zwj] = await Promise.all([
      {
        cacheKey: `v${ctx.version}/sequences.json`,
        url: `https://unicode.org/Public/emoji/${ctx.version}/emoji-sequences.txt`,
      },
      {
        cacheKey: `v${ctx.version}/zwj-sequences.json`,
        url: `https://unicode.org/Public/emoji/${ctx.version}/emoji-zwj-sequences.txt`,
      },
    ].map(async ({ cacheKey, url }) => {
      return await fetchCache(url, {
        cacheKey,
        parser(data) {
          const lines = data.split("\n");

          const sequences: EmojiSequence[] = [];

          for (let line of lines) {
          // skip empty line & comments
            if (line.trim() === "" || line.startsWith("#")) {
              continue;
            }

            // remove line comment
            const commentIndex = line.indexOf("#");
            if (commentIndex !== -1) {
              line = line.slice(0, commentIndex).trim();
            }

            const [hex, property, description] = line.split(";").map((col) => col.trim()).slice(0, 4);

            if (hex == null || property == null || description == null) {
              throw new Error(`invalid line: ${line}`);
            }

            const expandedHex = expandHexRange(hex);

            for (const hex of expandedHex) {
              sequences.push({
                hex: hex.replace(/\s+/g, "-"),
                property,
                description,
                gender: hex.includes(FEMALE_SIGN) ? "female" : hex.includes(MALE_SIGN) ? "male" : null,
              });
            }
          }

          return sequences;
        },
        bypassCache: ctx.force,
      });
    }));

    return {
      sequences: sequences || [],
      zwj: zwj || [],
    };
  },
  async emojis({ version, force }) {
  },
  variations: async (ctx) => {
    return fetchCache(`https://unicode.org/Public/${ctx.version}.0/ucd/emoji/emoji-variation-sequences.txt`, {
      cacheKey: `v${ctx.version}/variations.json`,
      parser(data) {
        const lines = data.split("\n");

        const variations: EmojiVariation[] = [];

        for (let line of lines) {
          // skip empty line & comments
          if (line.trim() === "" || line.startsWith("#")) {
            continue;
          }

          // remove line comment
          const commentIndex = line.indexOf("#");
          if (commentIndex !== -1) {
            line = line.slice(0, commentIndex).trim();
          }

          const [hex, style] = line.split(";").map((col) => col.trim()).slice(0, 4);

          if (hex == null || style == null) {
            throw new Error(`invalid line: ${line}`);
          }

          const hexcode = hex.replace(/\s+/g, "-");

          const type = style.replace("style", "").trim();

          if (type !== "text" && type !== "emoji") {
            throw new Error(`invalid style: ${style}`);
          }

          variations.push({
            emoji: type === "emoji" ? hexcode : null,
            text: type === "text" ? hexcode : null,
            property: ["Emoji"],
          });
        }

        return variations;
      },
      bypassCache: ctx.force,
    });
  },
});
