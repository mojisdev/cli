import type { EmojiData, EmojiSequence, EmojiVariation, Property } from "../types";
import { defineMojiAdapter } from "../adapter";
import { FEMALE_SIGN, MALE_SIGN } from "../constants";
import { extractEmojiVersion, extractUnicodeVersion } from "../utils";
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
  async emojis(ctx) {
    const emojiData = await fetchCache(`https://unicode.org/Public/${ctx.version}.0/ucd/emoji/emoji-data.txt`, {
      cacheKey: `v${ctx.version}/emoji-data.json`,
      parser(data) {
        const lines = data.split("\n");

        const emojiData: Record<string, EmojiData> = {};

        for (const line of lines) {
          // skip empty line & comments
          if (line.trim() === "" || line.startsWith("#")) {
            continue;
          }

          const lineCommentIndex = line.indexOf("#");
          const lineComment = lineCommentIndex !== -1 ? line.slice(lineCommentIndex + 1).trim() : "";

          let [hex, property] = line.split(";").map((col) => col.trim()).slice(0, 4);

          if (hex == null || property == null) {
            throw new Error(`invalid line: ${line}`);
          }

          // remove line comment from property
          const propertyCommentIndex = property.indexOf("#");
          if (propertyCommentIndex !== -1) {
            property = property.slice(0, propertyCommentIndex).trim();
          }

          if (property === "Extended_Pictographic") {
            continue;
          }

          const expandedHex = expandHexRange(hex);
          const emojiVersion = extractEmojiVersion(lineComment);

          const emoji: EmojiData = {
            description: lineComment,
            hexcode: "",
            gender: null,
            properties: [(property as Property) || "Emoji"],
            // TODO: use correct unicode version
            unicodeVersion: extractUnicodeVersion(emojiVersion, "16.0"),
            emojiVersion,
          };

          for (const hex of expandedHex) {
            if (emojiData[hex] != null) {
              emojiData[hex].properties = [...new Set([...emojiData[hex].properties, ...emoji.properties])];
            } else {
              emojiData[hex] = {
                ...emoji,
                hexcode: hex.replace(/\s+/g, "-"),
              };
            }
          }
        }

        return emojiData;
      },
      bypassCache: ctx.force,
    });

    return emojiData;
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
