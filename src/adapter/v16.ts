import type { EmojiSequence } from "../types";
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
    const sequences = await fetchCache(`https://unicode.org/Public/emoji/${ctx.version}/emoji-sequences.txt`, {
      cacheKey: `v${ctx.version}/sequences.json`,
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
              gender: hex === FEMALE_SIGN ? "female" : hex === MALE_SIGN ? "male" : null,
            });
          }
        }

        return sequences;
      },
      bypassCache: ctx.force,
    });

    return sequences;
  },
});
