import fs from "fs-extra";
import * as v from "valibot";

const EMOJI_VERSION_SCHEMA = v.object({
  emoji_version: v.nullable(v.string()),
  unicode_version: v.nullable(v.string()),
  draft: v.boolean(),
});

export type EmojiVersion = v.InferInput<typeof EMOJI_VERSION_SCHEMA>;

const LOCKFILE_SCHEMA = v.object({
  latestVersion: v.optional(v.nullable(v.string())),
  versions: v.array(EMOJI_VERSION_SCHEMA),
});

export type EmojiLockfile = v.InferInput<typeof LOCKFILE_SCHEMA>;

const DEFAULT_LOCKFILE = {
  versions: [],
  latestVersion: null,
} satisfies EmojiLockfile;

export async function readLockfile(): Promise<EmojiLockfile> {
  const json = await fs.readJSON("emojis.lock").catch(() => DEFAULT_LOCKFILE);

  return v.parseAsync(LOCKFILE_SCHEMA, json);
}

export async function writeLockfile(lockfile: EmojiLockfile): Promise<void> {
  await fs.writeJSON("emojis.lock", lockfile, { spaces: 2 });
}

export async function hasLockfile(): Promise<boolean> {
  return await fs.exists("emojis.lock");
}
