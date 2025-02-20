import type { EmojiVersion } from "./lockfile";
import consola from "consola";
import semver from "semver";
import { NO_EMOJI_VERSIONS } from "./constants";

export interface DraftVersion {
  emoji_version: string;
  unicode_version: string;
}

/**
 * Retrieves the current Unicode draft version by fetching and comparing root and emoji ReadMe files.
 *
 * This function fetches two ReadMe files from unicode.org:
 * - The main draft ReadMe
 * - The emoji draft ReadMe
 *
 * It then extracts and validates the version numbers from both files to ensure they match.
 * The emoji version uses major.minor format while the root version uses major.minor.patch.
 *
 * @returns A Promise that resolves to the current draft version string, or null if not found
 * @throws {Error} If either fetch fails
 * @throws {Error} If version extraction fails
 * @throws {Error} If versions between root and emoji drafts don't match
 */
export async function getCurrentDraftVersion(): Promise<DraftVersion | null> {
  const [rootResult, emojiResult] = await Promise.allSettled([
    "https://unicode.org/Public/draft/ReadMe.txt",
    "https://unicode.org/Public/draft/emoji/ReadMe.txt",
  ].map(async (url) => {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`failed to fetch ${url}: ${res.statusText}`);
    }

    return res.text();
  }));

  if (rootResult == null || emojiResult == null) {
    throw new Error("failed to fetch draft readme or draft emoji readme");
  }

  if (rootResult.status === "rejected" || emojiResult.status === "rejected") {
    consola.error({
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch draft readme or draft emoji readme");
  }

  const draftText = rootResult.value;
  const emojiText = emojiResult.value;

  const rootVersion = extractVersionFromReadme(draftText);
  const emojiVersion = extractVersionFromReadme(emojiText);

  if (rootVersion == null || emojiVersion == null) {
    throw new Error("failed to extract draft version");
  }

  // the emoji version is only using major.minor format.
  // so, we will need to add the last 0 to the version.

  // if they don't match the major and minor version, we will throw an error.
  if (semver.major(rootVersion) !== semver.major(`${emojiVersion}.0`) || semver.minor(rootVersion) !== semver.minor(`${emojiVersion}.0`)) {
    throw new Error("draft versions do not match");
  }

  return {
    emoji_version: emojiVersion,
    unicode_version: rootVersion,
  };
}

/**
 * Extracts the emoji version from a comment string.
 * The version should be in the format "E{major}.{minor}" (e.g. "E14.0").
 *
 * @param {string} comment - The comment string to extract the version from
 * @returns {string | null} The parsed version number, or null if no valid version was found
 *
 * @example
 * ```ts
 * extractEmojiVersion("E14.0") // returns "14.0"
 * extractEmojiVersion("Something else") // returns null
 * ```
 */
export function extractEmojiVersion(comment: string): string | null {
  const version = comment.match(/E(\d+\.\d)/);

  if (version != null && version[1] != null) {
    return version[1].trim();
  }

  return null;
}

/**
 * Extracts the Unicode version number from a given text string.
 *
 * @param {string} text - The text to extract the version number from
 * @returns {string | null} The extracted version number as a string, or null if no version number is found
 *
 * @example
 * ```ts
 * extractVersionFromReadme("Version 15.0.0 of the Unicode Standard") // Returns "15.0.0"
 * extractVersionFromReadme("Unicode15.1") // Returns "15.1"
 * extractVersionFromReadme("No version here") // Returns null
 * ```
 */
export function extractVersionFromReadme(text: string): string | null {
  const patterns = [
    /Version (\d+\.\d+(?:\.\d+)?) of the Unicode Standard/, // Most explicit
    /Unicode(\d+\.\d+(?:\.\d+)?)/, // From URLs
    /Version (\d+\.\d+)(?!\.\d)/, // Bare major.minor format
    /Unicode Emoji, Version (\d+\.\d+(?:\.\d+)?)/, // Emoji-specific version
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match == null || match[1] == null) continue;

    return match[1];
  }

  return null;
}

// https://unicode.org/reports/tr51/#EmojiVersions
export function extractUnicodeVersion(emojiVersion: string | null, unicodeVersion?: string): string | null {
  const coercedEmojiVersion = semver.coerce(emojiVersion);
  const coercedUnicodeVersion = semver.coerce(unicodeVersion);

  if (coercedEmojiVersion == null || coercedUnicodeVersion == null) {
    return null;
  }

  // v11+ aligned emoji and unicode specs (except for minor versions)
  if (semver.gte(coercedEmojiVersion, "11.0.0")) {
    // if the unicode version is not provided, we will return the emoji version.
    if (unicodeVersion == null) {
      return emojiVersion;
    }

    // return the smallest version between the emoji and unicode version.
    if (semver.lt(coercedEmojiVersion, coercedUnicodeVersion)) {
      return emojiVersion;
    }

    return unicodeVersion;
  }

  switch (emojiVersion) {
    case "0.7":
      return "7.0";
    case "1.0":
    case "2.0":
      return "8.0";
    case "3.0":
    case "4.0":
      return "9.0";
    case "5.0":
      return "10.0";
    default:
      // v6 is the first unicode spec emojis appeared in
      return "6.0";
  }
}
