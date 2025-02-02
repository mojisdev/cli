import path from "node:path";
import process from "node:process";
import fs from "fs-extra";

const CACHE_FOLDER = path.resolve(process.cwd(), ".cache");

const LOCAL_CACHE: Record<string, unknown> = {};

export async function writeCache<T>(name: string, data: T): Promise<T> {
  const filePath = path.join(CACHE_FOLDER, name);
  // create directory if it doesn't exist
  await fs.ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

  return data;
}

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

  const cache = LOCAL_CACHE[cacheKey] || await readCache(cacheKey);

  if (!bypassCache && cache != null) {
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
