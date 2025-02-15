import type { EmojiGroup, EmojiSequence, EmojiVariation } from "../types";
import semver from "semver";

export interface MojiAdapter {
  /**
   * The name of the adapter.
   */
  name: string;

  /**
   * A description of the adapter.
   */
  description: string;

  /**
   * A valid semver range for the emoji version this adapter supports.
   */
  range: string;

  /**
   * The name of the adapter to extend from.
   */
  extend?: string;

  /**
   * A function to generate the emoji groups for the specified version.
   */
  groups?: GroupFn;

  /**
   * A function to generate the emoji sequences for the specified version
   */
  sequences?: SequenceFn;

  /**
   * A function to generate the emoji dataset for the specified version.
   */
  emojis?: EmojiFn;

  /**
   * A function to generate emoji variations for the specified version.
   */
  variations?: EmojiVariationFn;
}

export interface BaseAdapterContext {
  version: string;
  force: boolean;
}

export type GroupFn = (ctx: BaseAdapterContext) => Promise<EmojiGroup[]>;
export type SequenceFn = (ctx: BaseAdapterContext) => Promise<{ zwj: EmojiSequence[]; sequences: EmojiSequence[] }>;
export type EmojiFn = (ctx: BaseAdapterContext) => Promise<any>;
export type EmojiVariationFn = (ctx: BaseAdapterContext) => Promise<EmojiVariation[]>;

export const ADAPTERS = new Map<string, MojiAdapter>();

export function defineMojiAdapter(adapter: MojiAdapter): MojiAdapter {
  // validate the adapter has name, description, range.
  if (!adapter.name) {
    throw new Error(`adapter.name is required`);
  }

  if (!adapter.description) {
    throw new Error(`adapter.description is required`);
  }

  if (!adapter.range) {
    throw new Error(`adapter.range is required`);
  }

  // verify the adapter.range is a valid semver range.
  if (semver.validRange(adapter.range) === null) {
    throw new Error(`adapter.range is not a valid semver range`);
  }

  if (adapter.extend == null) {
    // TODO: ensure the adapter has the required functions, when not extending.
  }

  ADAPTERS.set(adapter.name, adapter);

  return adapter;
}
