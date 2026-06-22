import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { fetchOpenModelModels } from "../src/models.ts"
import { fetchModelStabilitySummary } from "../src/stability.ts"
import { sanitizeApiKey } from "../src/auth.ts"

describe("Edge cases — models", () => {
  it("handles models with null/zero prices", async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
            data: [{
              key: "free-model",
              provider_key: "deepseek",
              provider_name: "DeepSeek",
              prices: {},
              max: {},
              supports: {},
              price_multiplier: 1,
            }],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          data: [{ id: "free-model", object: "model", owned_by: "deepseek", supported_protocols: ["messages"], created: 0 }],
          object: "list",
        }),
      }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 1)
    assert.equal(models[0]!.cost.input, 0)
    assert.equal(models[0]!.cost.output, 0)
    assert.equal(models[0]!.contextWindow, 128_000) // fallback default
    assert.equal(models[0]!.maxTokens, 16_384) // fallback default
  })

  it("handles models with empty supports object", async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
            data: [{
              key: "basic-model",
              provider_key: "deepseek",
              provider_name: "DeepSeek",
              prices: { input_cost_per_token: 1e-7, output_cost_per_token: 2e-7 },
              max: {},
              supports: { supports_reasoning: false, supports_vision: false },
              price_multiplier: 1,
            }],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          data: [{ id: "basic-model", object: "model", owned_by: "deepseek", supported_protocols: ["messages"], created: 0 }],
          object: "list",
        }),
      }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 1)
    assert.equal(models[0]!.reasoning, false)
    assert.deepEqual(models[0]!.input, ["text"])
  })

  it("handles models with only cache prices (no input/output)", async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
            data: [{
              key: "cache-only-model",
              provider_key: "anthropic",
              provider_name: "Anthropic",
              prices: { cache_read_input_token_cost: 1e-7, cache_creation_input_token_cost: 2e-7 },
              max: { max_input_tokens: 200_000, max_output_tokens: 8192 },
              supports: { supports_reasoning: true, supports_vision: false },
              price_multiplier: 1,
            }],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          data: [{ id: "cache-only-model", object: "model", owned_by: "anthropic", supported_protocols: ["messages"], created: 0 }],
          object: "list",
        }),
      }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 1)
    assert.equal(models[0]!.cost.input, 0) // no input price
    assert.equal(models[0]!.cost.output, 0) // no output price
    assert.ok(models[0]!.cost.cacheRead > 0)
    assert.ok(models[0]!.cost.cacheWrite > 0)
  })

  it("handles network error gracefully", async () => {
    const mockFetch = mock.fn(async () => {
      throw new TypeError("fetch failed")
    }) as unknown as typeof fetch

    await assert.rejects(
      () => fetchOpenModelModels({ fetchImpl: mockFetch }),
      (err: Error) => err.message.includes("fetch"),
    )
  })

  it("recovers when legacy endpoint fails with 401", async () => {
    let legacyCalled = false
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
            data: [{
              key: "deepseek-v4-flash",
              provider_key: "deepseek",
              provider_name: "DeepSeek",
              prices: { input_cost_per_token: 1.4e-7, output_cost_per_token: 2.8e-7 },
              max: { max_input_tokens: 1_000_000, max_output_tokens: 65536 },
              supports: { supports_reasoning: true, supports_vision: false },
              price_multiplier: 1,
            }],
          }),
        }
      }
      if ((url as string).includes("/v1/models")) {
        legacyCalled = true
        return { ok: false, status: 401, json: async () => ({ error: { message: "Unauthorized" } }) }
      }
      return { ok: false, json: async () => ({}) }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 1)
    assert.ok(legacyCalled)
  })
})

describe("Edge cases — stability", () => {
  it("handles empty data array", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    })) as unknown as typeof fetch

    const result = await fetchModelStabilitySummary({ fetchImpl: mockFetch })
    assert.equal(result.length, 0)
  })

  it("handles malformed JSON from server", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected token") },
    })) as unknown as typeof fetch

    await assert.rejects(
      () => fetchModelStabilitySummary({ fetchImpl: mockFetch }),
      (err: Error) => err.message.includes("Unexpected"),
    )
  })
})

describe("Edge cases — auth", () => {
  it("handles empty string in sanitizeApiKey", () => {
    assert.equal(sanitizeApiKey(""), "")
  })

  it("handles only whitespace in sanitizeApiKey", () => {
    assert.equal(sanitizeApiKey("   \n  \t  "), "")
  })

  it("handles key with om- prefix and special characters", () => {
    assert.equal(sanitizeApiKey("om-ABC-123_def"), "om-ABC-123_def")
  })
})
