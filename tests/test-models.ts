import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import { fetchOpenModelModels } from "../src/api/models.ts"

const MOCK_WEB_PAGE_1 = {
  success: true,
  meta: { pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 } },
  data: [
    {
      key: "deepseek-v4-flash",
      provider_key: "deepseek",
      provider_name: "DeepSeek",
      prices: {
        input_cost_per_token: 1.4e-7,
        output_cost_per_token: 2.8e-7,
        cache_read_input_token_cost: 2.8e-8,
        cache_creation_input_token_cost: 2.8e-8,
      },
      max: { max_input_tokens: 1_000_000, max_output_tokens: 65536, max_tokens: 65536 },
      supports: { supports_reasoning: true, supports_vision: false },
      price_multiplier: 1,
    },
    {
      key: "claude-sonnet-4-6",
      provider_key: "anthropic",
      provider_name: "Anthropic",
      prices: {
        input_cost_per_token: 3e-6,
        output_cost_per_token: 1.5e-5,
        cache_read_input_token_cost: 3e-7,
        cache_creation_input_token_cost: 3.75e-6,
      },
      max: { max_input_tokens: 200_000, max_output_tokens: 8192, max_tokens: 8192 },
      supports: { supports_reasoning: true, supports_vision: true },
      price_multiplier: 1,
    },
  ],
}

const MOCK_LEGACY = {
  data: [
    { id: "deepseek-v4-flash", object: "model", created: 0, owned_by: "deepseek", supported_protocols: ["messages"] },
    { id: "claude-sonnet-4-6", object: "model", created: 0, owned_by: "anthropic", supported_protocols: ["messages"] },
  ],
  object: "list",
}

describe("fetchOpenModelModels()", () => {
  it("fetches and parses models from the API", async () => {
    let webCallCount = 0

    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        webCallCount++
        return { ok: true, json: async () => MOCK_WEB_PAGE_1 }
      }
      if ((url as string).includes("/v1/models")) {
        return { ok: true, json: async () => MOCK_LEGACY }
      }
      return { ok: false, json: async () => ({}) }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })

    assert.equal(models.length, 2)
    assert.equal(webCallCount, 1)
  })

  it("parses DeepSeek V4 Flash correctly", async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return { ok: true, json: async () => MOCK_WEB_PAGE_1 }
      }
      return { ok: true, json: async () => MOCK_LEGACY }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    const ds = models.find((m) => m.id === "deepseek-v4-flash")

    assert.ok(ds)
    assert.equal(ds.api, "anthropic-messages")
    assert.equal(ds.contextWindow, 1_000_000)
    assert.equal(ds.maxTokens, 65_536)
    assert.equal(ds.reasoning, true)
    assert.deepEqual(ds.input, ["text"])
    // Prices: 1.4e-7 * 1M = 0.14, 2.8e-7 * 1M = 0.28
    assert.equal(ds.cost.input, 0.14)
    assert.equal(ds.cost.output, 0.28)
  })

  it("parses Anthropic model with images", async () => {
    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return { ok: true, json: async () => MOCK_WEB_PAGE_1 }
      }
      return { ok: true, json: async () => MOCK_LEGACY }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    const claude = models.find((m) => m.id === "claude-sonnet-4-6")

    assert.ok(claude)
    assert.equal(claude.api, "anthropic-messages")
    assert.equal(claude.contextWindow, 200_000)
    assert.equal(claude.reasoning, true)
    assert.deepEqual(claude.input, ["text", "image"])
    assert.equal(claude.cost.input, 3)
    assert.equal(claude.cost.output, 15)
  })

  it("skips image-only models", async () => {
    const webData = {
      success: true,
      meta: { pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } },
      data: [{
        key: "dall-e-3",
        provider_key: "openai",
        provider_name: "OpenAI",
        prices: { input_cost_per_image: 0.04 },
        max: {},
        supports: { supports_image_generation: true, supports_vision: false, supports_reasoning: false },
        price_multiplier: 1,
      }],
    }

    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        return { ok: true, json: async () => webData }
      }
      return { ok: true, json: async () => ({ data: [], object: "list" }) }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 0)
  })

  it("handles pagination across multiple pages", async () => {
    let callCount = 0

    const mockFetch = mock.fn(async (url: string) => {
      if ((url as string).includes("/web/v1/models")) {
        callCount++
        const urlStr = url as string
        const page = urlStr.includes("page=2") ? 2 : 1
        return {
          ok: true,
          json: async () => ({
            success: true,
            meta: { pagination: { page, pageSize: 1, total: 2, totalPages: 2 } },
            data: page === 1
              ? [{ key: "model-a", provider_key: "deepseek", provider_name: "DeepSeek", prices: {}, max: {}, supports: {}, price_multiplier: 1 }]
              : [{ key: "model-b", provider_key: "deepseek", provider_name: "DeepSeek", prices: {}, max: {}, supports: {}, price_multiplier: 1 }],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          data: [
            { id: "model-a", object: "model", created: 0, owned_by: "deepseek", supported_protocols: ["messages"] },
            { id: "model-b", object: "model", created: 0, owned_by: "deepseek", supported_protocols: ["messages"] },
          ],
          object: "list",
        }),
      }
    }) as unknown as typeof fetch

    const models = await fetchOpenModelModels({ fetchImpl: mockFetch })
    assert.equal(models.length, 2)
    assert.equal(callCount, 2)
  })
})
