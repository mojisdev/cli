import { describe, expect, it } from "vitest";
import { expandHexRange, fromHexToCodepoint } from "../../src/utils/hexcode";

describe("fromHexToCodepoint", () => {
  it("should convert hex string with hyphens to codepoints", () => {
    expect(fromHexToCodepoint("1F600-1F64F", "-")).toEqual([128512, 128591]);
  });

  it("should convert hex string with commas to codepoints", () => {
    expect(fromHexToCodepoint("1F600,1F64F", ",")).toEqual([128512, 128591]);
  });

  it("should handle single hex value", () => {
    expect(fromHexToCodepoint("1F600", "-")).toEqual([128512]);
  });

  it("should convert multiple hex values", () => {
    expect(fromHexToCodepoint("1F600-1F601-1F602", "-")).toEqual([128512, 128513, 128514]);
  });
});

describe("expandHexRange", () => {
  it("should expand hex range with .. notation", () => {
    expect(expandHexRange("0000..0002")).toEqual(["0000", "0001", "0002"]);
  });

  it("should handle single hex value without range", () => {
    expect(expandHexRange("0000")).toEqual(["0000"]);
  });

  it("should handle invalid range format", () => {
    expect(expandHexRange("0000..")).toEqual([]);
  });

  it("should expand larger hex ranges", () => {
    expect(expandHexRange("1F600..1F602")).toEqual(["1F600", "1F601", "1F602"]);
  });
});
