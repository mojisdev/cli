import * as v from "valibot";

export const SHORTCODE_PROVIDER_SCHEMA = v.union([
  v.literal("github"),
]);

export const SHORTCODE_PROVIDERS_SCHEMA = v.array(SHORTCODE_PROVIDER_SCHEMA);

export const GENERATOR_SCHEMA = v.union([
  v.literal("metadata"),
  v.literal("sequences"),
  v.literal("emojis"),
  v.literal("variations"),
  v.literal("shortcodes"),
  v.literal("unicode-names"),
]);
