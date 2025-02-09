import type { EmojiVersion } from "./lockfile";
import semver from "semver";
import { NO_EMOJI_VERSIONS } from "./constants";

/**
 * Converts a string to a URL-friendly slug.
 *
 * @param {string} val - The string to convert to a slug
 * @returns {string} A lowercase string with special characters removed and spaces replaced with hyphens
 *
 * @example
 * ```ts
 * slugify("Hello World!") // "hello-world"
 * slugify("Café & Restaurant") // "cafe-restaurant"
 * slugify("Product (Limited Edition)") // "product"
 * ```
 */
export function slugify(val: string): string {
  return val.normalize("NFD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/\(.+\)/g, "")
    .replace("&", "")
    .replace(/[\W_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Retrieves all available emoji versions from Unicode.org.
 * This function fetches both the root Unicode directory and the emoji-specific directory
 * to compile a comprehensive list of valid emoji versions.
 *
 * The function performs the following steps:
 * 1. Fetches content from Unicode.org's public directories
 * 2. Extracts version numbers using regex
 * 3. Validates each version
 * 4. Normalizes version numbers to valid semver format
 *
 * @throws {Error} When either the root or emoji page fetch fails
 * @returns {Promise<EmojiVersion[]>} A promise that resolves to an array of emoji versions,
 *                             sorted according to semver rules
 */
export async function getAllEmojiVersions(): Promise<EmojiVersion[]> {
  const [rootResult, emojiResult] = await Promise.allSettled([
    "https://unicode.org/Public/",
    "https://unicode.org/Public/emoji/",
  ].map(async (url) => {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`failed to fetch ${url}: ${res.statusText}`);
    }

    return res.text();
  }));

  if (rootResult == null || emojiResult == null) {
    throw new Error("failed to fetch root or emoji page");
  }

  if (rootResult.status === "rejected" || emojiResult.status === "rejected") {
    console.error({
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch root or emoji page");
  }

  const rootHtml = rootResult.value;
  const emojiHtml = emojiResult.value;

  const versionRegex = /href="(\d+\.\d+(?:\.\d+)?)\/?"/g;

  const draft = await getCurrentDraftVersion();

  const versions: EmojiVersion[] = [];

  for (const match of rootHtml.matchAll(versionRegex)) {
    if (match == null || match[1] == null) continue;

    const version = match[1];

    if (!await isEmojiVersionValid(version)) {
      continue;
    }

    if (versions.some((v) => v.unicode_version === version)) {
      continue;
    }

    versions.push({
      emoji_version: null,
      unicode_version: version,
      draft: version === draft,
    });
  }

  for (const match of emojiHtml.matchAll(versionRegex)) {
    if (match == null || match[1] == null) continue;

    let version = match[1];

    // for the emoji page, the versions is not valid semver.
    // so we will add the last 0 to the version.
    // handle both 5.0 and 12.0 -> 5.0.0 and 12.0.0
    if (version.length === 3 || version.length === 4) {
      version += ".0";
    }

    if (!await isEmojiVersionValid(version)) {
      continue;
    }

    // check if the unicode_version already exists.
    // if it does, we will update the emoji version.
    const existing = versions.find((v) => v.unicode_version === version);

    if (existing) {
      existing.emoji_version = match[1];
      continue;
    }

    versions.push({
      emoji_version: match[1],
      unicode_version: null,
      draft: version === draft,
    });
  }

  return versions.sort((a, b) => {
    // if unicode version is null, it means it is from the emoji page.
    // which contains emoji versions, in major.minor format.
    // so, we will add the last 0 to the version, to be able to compare them.
    if (a.unicode_version == null) {
      a.unicode_version = `${a.emoji_version}.0`;
    }

    if (b.unicode_version == null) {
      b.unicode_version = `${b.emoji_version}.0`;
    }

    return semver.compare(b.unicode_version, a.unicode_version);
  });
}

/**
 * Checks if the given emoji version is valid according to Unicode Consortium standards.
 *
 * Due to Unicode Consortium's versioning changes in 2017:
 * - Versions 6-10 don't exist (they aligned emoji versions with Unicode versions)
 * - Versions 1-5 only had major releases (no minor or patch versions)
 *
 * @param {string} version - The emoji version string to validate
 * @returns {Promise<boolean>} A promise that resolves to true if the version is valid, false otherwise
 *
 * @example
 * ```ts
 * await isEmojiVersionValid('11.0.0') // true
 * await isEmojiVersionValid('6.0.0')  // false
 * await isEmojiVersionValid('1.1.0')  // false
 * ```
 */
export async function isEmojiVersionValid(version: string): Promise<boolean> {
  // unicode consortium made a huge change in v11, because that is actually the version
  // right after v5. They decided to align the unicode version with the emoji version in 2017.
  // So, no emoji version 6, 7, 8, 9, or 10.
  const isVersionInNoEmojiVersions = NO_EMOJI_VERSIONS.find((v) => semver.satisfies(version, v));
  if (isVersionInNoEmojiVersions) {
    return false;
  }

  // from v1 to v5, there was only major releases. So no v1.1, v1.2, etc.
  // only, v1.0, v2.0, v3.0, v4.0, v5.0.
  // if version has any minor or patch, it is invalid.
  if (semver.minor(version) !== 0 || semver.patch(version) !== 0) {
    return false;
  }

  return true;
}

export async function getCurrentDraftVersion(): Promise<string | null> {
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
    console.error({
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch draft readme or draft emoji readme");
  }

  const draftText = rootResult.value;
  const emojiText = emojiResult.value;

  const rootVersion = extractVersion(draftText);
  const emojiVersion = extractVersion(emojiText);

  if (rootVersion == null || emojiVersion == null) {
    throw new Error("failed to extract draft version");
  }

  // the emoji version is only using major.minor format.
  // so, we will need to add the last 0 to the version.

  // if they don't match the major and minor version, we will throw an error.
  if (semver.major(rootVersion) !== semver.major(`${emojiVersion}.0`) || semver.minor(rootVersion) !== semver.minor(`${emojiVersion}.0`)) {
    throw new Error("draft versions do not match");
  }

  return rootVersion;
}

function extractVersion(text: string): string | null {
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
