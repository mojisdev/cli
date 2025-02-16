import { describe, expect, it } from "vitest";
import { extractEmojiVersion, slugify } from "../src/utils";

describe("slugify", () => {
  it("should convert string to slug format", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should remove diacritics", () => {
    expect(slugify("héllo wörld")).toBe("hello-world");
  });

  it("should remove parentheses and their content", () => {
    expect(slugify("hello (world)")).toBe("hello");
  });

  it("should trim whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("should remove ampersands", () => {
    expect(slugify("hello & world")).toBe("hello-world");
  });

  it("should replace special characters with hyphens", () => {
    expect(slugify("hello_world!@#$%^")).toBe("hello-world");
  });

  it("should convert to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });
});

describe("extractEmojiVersion", () => {
  it("should extract valid emoji version numbers", () => {
    expect(extractEmojiVersion("E14.0")).toBe("14.0");
    expect(extractEmojiVersion("E15.1")).toBe("15.1");
    expect(extractEmojiVersion("E5.0")).toBe("5.0");
  });

  it("should return null for invalid formats", () => {
    expect(extractEmojiVersion("14.0")).toBeNull();
    expect(extractEmojiVersion("Hello E14")).toBeNull();
    expect(extractEmojiVersion("E14")).toBeNull();
    expect(extractEmojiVersion("")).toBeNull();
  });

  it("should handle whitespace", () => {
    expect(extractEmojiVersion(" E14.0 ")).toBe("14.0");
    expect(extractEmojiVersion("E 14.0")).toBeNull();
  });
});
