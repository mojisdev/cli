import type { EmojiVersion } from "./lockfile";
import consola from "consola";
import semver from "semver";
import { NO_EMOJI_VERSIONS } from "./constants";
import { getCurrentDraftVersion } from "./versions";

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
    consola.error({
      root: rootResult.status === "rejected" ? rootResult.reason : "ok",
      emoji: emojiResult.status === "rejected" ? emojiResult.reason : "ok",
    });

    throw new Error("failed to fetch root or emoji page");
  }

  const rootHtml = rootResult.value;
  const emojiHtml = emojiResult.value;

  const versionRegex = /href="(\d+\.\d+(?:\.\d+)?)\/?"/g;

  const draft = await getCurrentDraftVersion();

  if (draft == null) {
    throw new Error("failed to fetch draft version");
  }

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
      draft: version === draft.unicode_version || version === draft.emoji_version,
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

    let unicode_version = null;

    // the emoji version 13.1 is using the unicode
    // 13.0, since it was never released.
    if (match[1] === "13.1") {
      unicode_version = "13.0.0";
    }

    if (match[1] === "5.0") {
      unicode_version = "10.0.0";
    }

    if (match[1] === "4.0" || match[1] === "3.0") {
      unicode_version = "9.0.0";
    }

    if (match[1] === "2.0" || match[1] === "1.0") {
      unicode_version = "8.0.0";
    }

    if (existing) {
      existing.unicode_version = unicode_version || existing.unicode_version;
      existing.emoji_version = match[1];
      continue;
    }

    versions.push({
      emoji_version: match[1],
      unicode_version,
      draft: version === draft.unicode_version || version === draft.emoji_version,
    });
  }

  return versions.sort((a, b) => semver.compare(`${b.emoji_version}.0`, `${a.emoji_version}.0`));
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
  if (semver.major(version) <= 5 && (semver.minor(version) !== 0 || semver.patch(version) !== 0)) {
    return false;
  }

  return true;
}
