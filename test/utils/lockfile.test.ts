import fs from "fs-extra";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { type EmojiLockfile, hasLockfile, readLockfile, writeLockfile } from "../../src/lockfile";

describe("hasLockfile", () => {
  it("should return true when lockfile exists", async () => {
    const path = await testdir({
      "emojis.lock": "{}",
    });

    const result = await hasLockfile(path);
    expect(result).toBe(true);
  });

  it("should return false when lockfile does not exist", async () => {
    const path = await testdir({});

    const result = await hasLockfile(path);
    expect(result).toBe(false);
  });
});

describe("writeLockfile", () => {
  it("should write valid lockfile", async () => {
    const path = await testdir({});
    const lockfile = {
      versions: [{
        emoji_version: "15.0",
        unicode_version: "15.0",
        draft: false,
      }],
      latestVersion: "15.0",
    };

    await writeLockfile(lockfile, path);
    expect(await fs.exists(`${path}/emojis.lock`)).toBe(true);
  });

  it("should throw error for invalid lockfile", async () => {
    const path = await testdir({});
    const invalidLockfile = {
      versions: [{
        // @ts-expect-error invalid type for emoji_version
        emoji_version: 123,
        unicode_version: null,
        draft: false,
      }],
    } satisfies EmojiLockfile;

    await expect(writeLockfile(invalidLockfile as any, path)).rejects.toThrow("invalid lockfile");
  });
});

describe("readLockfile", () => {
  it("should read existing lockfile", async () => {
    const path = await testdir({
      "emojis.lock": JSON.stringify({
        versions: [{
          emoji_version: "15.0",
          unicode_version: "15.0",
          draft: false,
        }],
        latestVersion: "15.0",
      }),
    });

    const result = await readLockfile(path);
    expect(result).toEqual({
      versions: [{
        emoji_version: "15.0",
        unicode_version: "15.0",
        draft: false,
      }],
      latestVersion: "15.0",
    });
  });

  it("should return default lockfile when file does not exist", async () => {
    const path = await testdir({});

    const result = await readLockfile(path);
    expect(result).toEqual({
      versions: [],
      latestVersion: null,
    });
  });

  it("should throw error for invalid lockfile content", async () => {
    const path = await testdir({
      "emojis.lock": JSON.stringify({
        versions: [{
          // @ts-expect-error invalid type for emoji_version
          emoji_version: 123,
          unicode_version: null,
          draft: false,
        }],
      } satisfies EmojiLockfile),
    });

    await expect(readLockfile(path)).rejects.toThrow();
  });
});
