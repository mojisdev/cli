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
