import path from "node:path";
import process from "node:process";
import fs from "fs-extra";
import * as v from "valibot";

const EMOJI_VERSION_SCHEMA = v.object({
  emoji_version: v.nullable(v.string()),
  unicode_version: v.nullable(v.string()),
  draft: v.boolean(),
});

export type EmojiVersion = v.InferInput<typeof EMOJI_VERSION_SCHEMA>;

const LOCKFILE_SCHEMA = v.object({
  versions: v.array(EMOJI_VERSION_SCHEMA),
});

export type EmojiLockfile = v.InferInput<typeof LOCKFILE_SCHEMA>;

const DEFAULT_LOCKFILE = {
  versions: [],
} satisfies EmojiLockfile;

/**
 * Reads and parses the emoji lockfile from the current directory.
 * If the file doesn't exist, returns the default lockfile structure.
 *
 * @param {string} cwd - The directory to read the lockfile from
 *
 * @returns {Promise<EmojiLockfile>} Promise that resolves to the parsed emoji lockfile configuration
 * @throws {Error} If the lockfile exists but contains invalid data
 */
export async function readLockfile(cwd: string = process.cwd()): Promise<EmojiLockfile> {
  const json = await fs.readJSON(path.join(cwd, "emojis.lock")).catch(() => DEFAULT_LOCKFILE);

  return v.parseAsync(LOCKFILE_SCHEMA, json);
}

/**
 * Writes the emoji lockfile to disk after validating its contents.
 *
 * @param {EmojiLockfile} lockfile - The emoji lockfile object to write
 * @param {string} cwd - The directory to write the lockfile to
 *
 * @throws {Error} If the lockfile validation fails
 * @returns {Promise<void>} A promise that resolves when the file is written
 */
export async function writeLockfile(lockfile: EmojiLockfile, cwd: string = process.cwd()): Promise<void> {
  const result = await v.safeParseAsync(LOCKFILE_SCHEMA, lockfile);

  if (result.success === false) {
    throw new Error(`invalid lockfile: ${result.issues.join(", ")}`);
  }

  await fs.writeJSON(path.join(cwd, "emojis.lock"), result.output, { spaces: 2 });
}

/**
 * Checks if an emoji lockfile exists in the current directory.
 * The lockfile is used to track the installed emojis.
 *
 * @param {string} cwd - The directory to check for the lockfile
 *
 * @returns {Promise<boolean>} A promise that resolves to true if the lockfile exists, false otherwise
 */
export async function hasLockfile(cwd: string = process.cwd()): Promise<boolean> {
  return await fs.exists(path.join(cwd, "emojis.lock"));
}
