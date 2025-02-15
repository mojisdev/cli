import { describe, expect, it } from "vitest";
import { isEmojiVersionValid, slugify } from "../src/utils";

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
