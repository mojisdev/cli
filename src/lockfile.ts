import fs from "fs-extra";
import * as v from "valibot";

const LOCKFILE_SCHEMA = v.object({
  latestVersion: v.optional(v.nullable(v.string())),
  versions: v.array(v.string()),
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
