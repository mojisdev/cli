import type { Emoji, EmojiData, EmojiSequence, EmojiVariation, Property } from "../types";
import { defineMojiAdapter } from "../adapter";
import { FEMALE_SIGN, MALE_SIGN } from "../constants";
import { fetchCache } from "../utils/cache";
import { expandHexRange } from "../utils/hexcode";
import { extractEmojiVersion, extractUnicodeVersion } from "../versions";

export default defineMojiAdapter({
  name: "v13",
  description: "adapter for version 13 & 13.1",
  range: ">=13.0.0 <14.0.0",
  extend: "base",
  sequences: async (ctx) => {
    const [sequences, zwj] = await Promise.all([
      {
        cacheKey: `v${ctx.emojiVersion}/sequences.json`,
        url: `https://unicode.org/Public/emoji/${ctx.emojiVersion}/emoji-sequences.txt`,
      },
      {
        cacheKey: `v${ctx.emojiVersion}/zwj-sequences.json`,
        url: `https://unicode.org/Public/emoji/${ctx.emojiVersion}/emoji-zwj-sequences.txt`,
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
    const unicodeNames = await this.unicodeNames!(ctx);
    // const { sequences, zwj } = await this.sequences!(ctx);
    // const metadata = await this.metadata!(ctx);
    // const variations = await this.variations!(ctx);

    const emojis: Record<string, Record<string, Record<string, Emoji>>> = {};

    const emojiData = await fetchCache(`https://unicode.org/Public/${ctx.emojiVersion === "13.1" ? "13.0" : ctx.emojiVersion}.0/ucd/emoji/emoji-data.txt`, {
      cacheKey: `v${ctx.emojiVersion}/emoji-data.json`,
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
            unicodeVersion: extractUnicodeVersion(emojiVersion, ctx.unicodeVersion),
            emojiVersion,
            name: unicodeNames[hex] || "",
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

    return {
      emojiData,
      emojis,
    };
  },
  variations: async (ctx) => {
    return fetchCache(`https://unicode.org/Public/${ctx.emojiVersion === "13.1" ? "13.0" : ctx.emojiVersion}.0/ucd/emoji/emoji-variation-sequences.txt`, {
      cacheKey: `v${ctx.emojiVersion}/variations.json`,
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
