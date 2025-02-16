export interface EmojiGroup {
  name: string;
  slug: string;
  subgroups: string[];
}

export interface Emoji {
  name: string;
  slug: string;
  components: EmojiComponent[];
  hexcode: string;
  type: "ZWJ" | "SINGLE";
}

// eslint-disable-next-line ts/no-empty-object-type
export interface EmojiComponent {

}

export interface EmojiMetadata {
  group: string;
  subgroup: string;
  qualifier: string;
  unicodeVersion: string | null;
  emojiVersion: string | null;
  description: string;
  emoji: string | null;
  hexcodes: string[];
}

export interface EmojiData {
  description: string;
  gender: string | null;
  hexcode: string;
  properties: Property[];
  unicodeVersion: string | null;
  emojiVersion: string | null;
}

export interface EmojiShortcode {
  /**
   * The shortcode for the emoji.
   */
  code: string;

  /**
   * Vendor-specific shortcode.
   *
   * e.g. GitHub, Slack, Discord etc.
   */
  vendor: string;

  /**
   * Source of the shortcode.
   *
   * e.g. GitHub, Slack, Discord etc.
   */
  source?: string;
}

export interface EmojiSequence {
  property: string;
  hex: string;
  description: string;
  gender: string | null;
}

export type Property =
  // An emoji character.
  | "Basic_Emoji"
  | "Emoji"
  // The presentation in which to display the emoji character. Either emoji or text.
  | "Emoji_Presentation"
  // An emoji or unicode character for modifying complex sequences (hair style, skin tone, etc),
  // and should never be used as a stand-alone emoji.
  | "Emoji_Component"
  // An emoji character that modifies a preceding emoji base character.
  | "Emoji_Modifier"
  // An emoji character. Can be modified with a subsequent emoji modifier.
  | "Emoji_Modifier_Base"
  // A sequence of a base and modifier ("Emoji_Modifier_Base" + "Emoji_Modifier").
  | "Emoji_Modifier_Sequence"
  // A sequence of unicode characters representing the available keys on a
  // phone dial: 0-9, *, # ("Key" + "FE0F" + "20E3").
  | "Emoji_Keycap_Sequence"
  // A sequence of 2 regional indicators representing a region flag (nation).
  // "Regional_Indicator" + "Regional_Indicator".
  | "Emoji_Flag_Sequence"
  // A sequence of characters that are not ZWJ or flag sequences.
  // Currently used for representing sub-region/division flags (country).
  | "Emoji_Tag_Sequence"
  // A sequence of multiple emoji characters joined with a zero-width-joiner (200D).
  | "Emoji_ZWJ_Sequence"
  // Either an "Emoji", "Emoji" + "FE0F", or "Emoji_Keycap_Sequence".
  | "Emoji_Combining_Sequence"
  // An emoji slot that is reserved for future allocations and releases.
  | "Extended_Pictographic"
  // A unicode character representing one of the 26 letters of the alphabet, A-Z.
  | "Regional_Indicator"
  // v13+ renamed properties
  | "RGI_Emoji_Flag_Sequence"
  | "RGI_Emoji_Modifier_Sequence"
  | "RGI_Emoji_Tag_Sequence"
  | "RGI_Emoji_ZWJ_Sequence";

export interface EmojiVariation {
  text: string | null;
  emoji: string | null;
  property?: Property[];
}
