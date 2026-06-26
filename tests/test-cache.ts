import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { readModelCache, writeModelCache, CACHE_TTL_MS } from "../src/cache.ts"
import type { CacheFs } from "../src/cache.ts"
import type { OpenModelProviderModel } from "../src/api/models.ts"

const SAMPLE_MODELS: readonly OpenModelProviderModel[] = [
  {
    id: "test-model",
    name: "test-model",
    reasoning: false,
    input: ["text"] as const,
    cost: { input: 0.1, output: 0.2, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128_000,
    maxTokens: 16_384,
    api: "anthropic-messages",
  },
]

function mockFs(overrides: Partial<CacheFs>): CacheFs {
  return {
    readFile: async () => { throw new Error("unexpected readFile") },
    writeFile: async () => { throw new Error("unexpected writeFile") },
    mkdir: async () => { throw new Error("unexpected mkdir") },
    ...overrides,
  }
}

describe("readModelCache()", () => {
  it("returns models when cache is valid and fresh", async () => {
    const cache = { timestamp: Date.now(), models: SAMPLE_MODELS }
    const fs = mockFs({ readFile: async () => JSON.stringify(cache) })

    const result = await readModelCache(fs)
    assert.deepEqual(result, SAMPLE_MODELS)
  })

  it("returns null when cache file is missing (ENOENT)", async () => {
    const err = Object.assign(new Error("not found"), { code: "ENOENT" })
    const fs = mockFs({ readFile: async () => { throw err } })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when cache is expired", async () => {
    const cache = { timestamp: Date.now() - CACHE_TTL_MS - 1, models: SAMPLE_MODELS }
    const fs = mockFs({ readFile: async () => JSON.stringify(cache) })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when JSON is malformed", async () => {
    const fs = mockFs({ readFile: async () => "not-json{" })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when cache structure is invalid (missing timestamp)", async () => {
    const fs = mockFs({ readFile: async () => JSON.stringify({ models: [] }) })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when cache structure is invalid (missing models)", async () => {
    const fs = mockFs({ readFile: async () => JSON.stringify({ timestamp: Date.now() }) })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when models is not an array", async () => {
    const fs = mockFs({
      readFile: async () => JSON.stringify({ timestamp: Date.now(), models: "not-array" }),
    })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })

  it("returns null when timestamp is not a number", async () => {
    const fs = mockFs({
      readFile: async () => JSON.stringify({ timestamp: "string", models: [] }),
    })

    const result = await readModelCache(fs)
    assert.equal(result, null)
  })
})

describe("writeModelCache()", () => {
  it("writes models to cache file with a timestamp", async () => {
    let written = ""
    const fs = mockFs({
      mkdir: async () => undefined,
      writeFile: async (_path: string, data: string) => { written = data },
    })

    await writeModelCache(SAMPLE_MODELS, fs)

    const parsed = JSON.parse(written)
    assert.equal(typeof parsed.timestamp, "number")
    assert.deepEqual(parsed.models, SAMPLE_MODELS)
  })

  it("creates cache directory if missing", async () => {
    let mkdirCalled = false
    const fs = mockFs({
      mkdir: async () => { mkdirCalled = true },
      writeFile: async () => {},
    })

    await writeModelCache(SAMPLE_MODELS, fs)
    assert.equal(mkdirCalled, true)
  })

  it("silently ignores mkdir errors", async () => {
    const fs = mockFs({
      mkdir: async () => { throw new Error("permission denied") },
    })

    await writeModelCache(SAMPLE_MODELS, fs)
  })

  it("silently ignores writeFile errors", async () => {
    const fs = mockFs({
      mkdir: async () => undefined,
      writeFile: async () => { throw new Error("disk full") },
    })

    await writeModelCache(SAMPLE_MODELS, fs)
  })
})
