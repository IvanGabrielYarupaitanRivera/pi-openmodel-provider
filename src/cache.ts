/**
 * Local cache for fetched OpenModel models.
 *
 * Avoids hitting the OpenModel API on every startup or /reload.
 * Cache is stored at ~/.pi/agent/cache/openmodel-models.json with a 5-minute TTL.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { homedir } from "node:os"
import type { OpenModelProviderModel } from "./api/models.ts"

export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const CACHE_DIR = join(homedir(), ".pi", "agent", "cache")
const CACHE_FILE = join(CACHE_DIR, "openmodel-models.json")

interface ModelCache {
  /** Unix timestamp (ms) when the cache was written */
  timestamp: number
  /** Cached model list */
  models: readonly OpenModelProviderModel[]
}

/** Minimal fs interface matching what cache.ts actually uses */
export interface CacheFs {
  readFile(path: string, encoding: string): Promise<string>
  writeFile(path: string, data: string, encoding?: string): Promise<void>
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
}

const DEFAULT_FS: CacheFs = {
  readFile: readFile as CacheFs["readFile"],
  writeFile: writeFile as CacheFs["writeFile"],
  mkdir: mkdir as CacheFs["mkdir"],
}

/**
 * Read models from cache.
 * Returns null if cache is missing, expired, or corrupted.
 */
export async function readModelCache(fsImpl?: CacheFs): Promise<readonly OpenModelProviderModel[] | null> {
  const { readFile: rf } = fsImpl ?? DEFAULT_FS
  try {
    const raw = await rf(CACHE_FILE, "utf-8")
    const cache: ModelCache = JSON.parse(raw)

    if (typeof cache.timestamp !== "number" || !Array.isArray(cache.models)) {
      return null
    }

    const age = Date.now() - cache.timestamp
    if (age >= CACHE_TTL_MS) {
      return null // expired
    }

    return cache.models
  } catch {
    return null // no cache or invalid JSON
  }
}

/**
 * Write models to the local cache.
 * Failures are silently ignored — cache is optional.
 */
export async function writeModelCache(models: readonly OpenModelProviderModel[], fsImpl?: CacheFs): Promise<void> {
  const { mkdir: mkd, writeFile: wf } = fsImpl ?? DEFAULT_FS
  try {
    await mkd(CACHE_DIR, { recursive: true })
    const cache: ModelCache = { timestamp: Date.now(), models }
    await wf(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8")
  } catch {
    // Cache writes are best-effort
  }
}
