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
