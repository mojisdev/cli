import path from "node:path";
import process from "node:process";
import consola from "consola";
import { green } from "farver/fast";
import fs from "fs-extra";

const CACHE_FOLDER = path.resolve(process.cwd(), ".cache");

const LOCAL_CACHE: Record<string, unknown> = {};

/**
 * Writes data to a cache file.
 *
 * @param {string} name - The name/path of the cache file to write to
 * @param {T} data - The data to write to the cache file
 * @template T - The type of data being cached
 * @returns {Promise<T>} A promise that resolves with the cached data
 */
export async function writeCache<T>(name: string, data: T): Promise<T> {
  const filePath = path.join(CACHE_FOLDER, name);
  // create directory if it doesn't exist
  await fs.ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

  return data;
}

/**
 * Reads and parses JSON data from a cache file.
 *
 * @param {string} name - The name of the cache file to read
 * @template T - The type of data stored in the cache file
 * @returns {Promise<T>} A promise that resolves to the parsed cache data of type T, or undefined if the file doesn't exist
 */
export async function readCache<T>(name: string): Promise<T | undefined> {
  const filePath = path.join(CACHE_FOLDER, name);

  if (!(await fs.pathExists(filePath))) {
    return undefined;
  }

  const data = await fs.readFile(filePath, "utf-8");

  return JSON.parse(data);
}

export interface FetchCacheOptions<TData = unknown> {
  cacheKey: string;
  parser: (data: string) => TData;
  options?: RequestInit;
  bypassCache?: boolean;
}

export async function fetchCache<TData = unknown>(
  url: string,
  options: FetchCacheOptions<TData>,
): Promise<TData> {
  const { cacheKey, parser, bypassCache, options: fetchOptions } = options;

  const cache = LOCAL_CACHE[cacheKey] || await readCache<TData>(cacheKey);

  if (!bypassCache && cache != null) {
    consola.debug(`cache hit: ${green(cacheKey)}`);
    LOCAL_CACHE[cacheKey] = cache;

    return cache as TData;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.statusText}`);
  }

  const data = await response.text();

  const parsedData = parser(data);

  LOCAL_CACHE[cacheKey] = parsedData;
  await writeCache(cacheKey, parsedData);

  return parsedData;
}
