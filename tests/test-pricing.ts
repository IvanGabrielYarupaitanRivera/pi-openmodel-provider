import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { fetchOpenModelModels } from "../src/api/models.ts"

describe("Model pricing from API", () => {
  it("uses real pricing from API (no hardcoding)", async () => {
    const webData = {
      success: true,
      meta: { pagination: { page: 1, pageSize: 20, total: 3, totalPages: 1 } },
      data: [
        {
          key: "deepseek-v4-flash",
          provider_key: "deepseek",
          provider_name: "DeepSeek",
          prices: { input_cost_per_token: 1.4e-7, output_cost_per_token: 2.8e-7, cache_read_input_token_cost: 2.8e-8, cache_creation_input_token_cost: 2.8e-8 },
          max: { max_input_tokens: 1_000_000, max_output_tokens: 65536 },
          supports: { supports_reasoning: true, supports_vision: false },
          price_multiplier: 1,
        },
        {
          key: "claude-sonnet-4-6",
          provider_key: "anthropic",
          provider_name: "Anthropic",
          prices: { input_cost_per_token: 3e-6, output_cost_per_token: 1.5e-5, cache_read_input_token_cost: 3e-7, cache_creation_input_token_cost: 3.75e-6 },
          max: { max_input_tokens: 200_000, max_output_tokens: 8192 },
          supports: { supports_reasoning: true, supports_vision: true },
          price_multiplier: 1,
        },
        {
          key: "gemini-3.5-flash",
          provider_key: "gemini",
          provider_name: "Google",
          prices: { input_cost_per_token: 3e-7, output_cost_per_token: 1.2e-6 },
          max: { max_input_tokens: 1_000_000, max_output_tokens: 8192 },
          supports: { supports_reasoning: false, supports_vision: true },
          price_multiplier: 1,
        },
      ],
    }

    const legacyData = {
      data: [
        { id: "deepseek-v4-flash", object: "model", owned_by: "deepseek", supported_protocols: ["messages"], created: 0 },
        { id: "claude-sonnet-4-6", object: "model", owned_by: "anthropic", supported_protocols: ["messages"], created: 0 },
        { id: "gemini-3.5-flash", object: "model", owned_by: "gemini", supported_protocols: ["gemini"], created: 0 },
      ],
      object: "list",
    }

    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return { ok: true, json: async () => webData }
      }
      return { ok: true, json: async () => legacyData }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })

    // DeepSeek: 1.4e-7 * 1M = 0.14, 2.8e-7 * 1M = 0.28
    const ds = models.find((m) => m.id === "deepseek-v4-flash")
    assert.ok(ds)
    assert.equal(ds.cost.input, 0.14)
    assert.equal(ds.cost.output, 0.28)
    assert.ok(ds.cost.cacheRead > 0)
    assert.ok(ds.cost.cacheWrite > 0)

    // Anthropic: 3e-6 * 1M = 3, 1.5e-5 * 1M = 15
    const claude = models.find((m) => m.id === "claude-sonnet-4-6")
    assert.ok(claude)
    assert.equal(claude.cost.input, 3)
    assert.equal(claude.cost.output, 15)

    // Gemini: 3e-7 * 1M = 0.30, 1.2e-6 * 1M = 1.20
    const gemini = models.find((m) => m.id === "gemini-3.5-flash")
    assert.ok(gemini)
    assert.equal(gemini.cost.input, 0.30)
    assert.equal(gemini.cost.output, 1.20)
  })

  it("applies price multiplier", async () => {
    const webData = {
      success: true,
      meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
      data: [{
        key: "discounted-model",
        provider_key: "anthropic",
        provider_name: "Anthropic",
        prices: { input_cost_per_token: 1e-6, output_cost_per_token: 4e-6 },
        max: { max_input_tokens: 200_000, max_output_tokens: 8192 },
        supports: { supports_reasoning: true, supports_vision: false },
        price_multiplier: 0.5,
      }],
    }

    const legacyData = {
      data: [{ id: "discounted-model", object: "model", owned_by: "anthropic", supported_protocols: ["messages"], created: 0 }],
      object: "list",
    }

    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return { ok: true, json: async () => webData }
      }
      return { ok: true, json: async () => legacyData }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    const model = models[0]
    assert.ok(model)
    // 1e-6 * 1M * 0.5 = 0.50
    assert.equal(model.cost.input, 0.50)
    // 4e-6 * 1M * 0.5 = 2.00
    assert.equal(model.cost.output, 2.00)
  })
})
