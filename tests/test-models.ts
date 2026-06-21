import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseApiModel } from "../src/models.ts"
import type { OpenModelApiModel } from "../src/models.ts"

describe("parseApiModel()", () => {
  it("converts a DeepSeek model correctly", () => {
    const input: OpenModelApiModel = {
      id: "deepseek-v4-flash",
      object: "model",
      created: 1778315466,
      owned_by: "deepseek",
      supported_protocols: ["messages"],
    }

    const result = parseApiModel(input)
    assert.ok(result, "should parse successfully")
    assert.equal(result.id, "deepseek-v4-flash")
    assert.equal(result.api, "anthropic-messages")
    assert.equal(result.contextWindow, 1_000_000)
    assert.equal(result.maxTokens, 65_536)
    assert.equal(result.reasoning, true)
    assert.deepEqual(result.input, ["text"])
  })

  it("converts an Anthropic model with images", () => {
    const input: OpenModelApiModel = {
      id: "claude-sonnet-4-6",
      object: "model",
      created: 1778212220,
      owned_by: "anthropic",
      supported_protocols: ["messages"],
    }

    const result = parseApiModel(input)
    assert.ok(result)
    assert.equal(result.id, "claude-sonnet-4-6")
    assert.equal(result.api, "anthropic-messages")
    assert.equal(result.contextWindow, 200_000)
    assert.equal(result.reasoning, true)
    assert.deepEqual(result.input, ["text", "image"])
  })

  it("converts a Gemini model", () => {
    const input: OpenModelApiModel = {
      id: "gemini-3.5-flash",
      object: "model",
      created: 1779253516,
      owned_by: "gemini",
      supported_protocols: ["gemini"],
    }

    const result = parseApiModel(input)
    assert.ok(result)
    assert.equal(result.id, "gemini-3.5-flash")
    assert.equal(result.api, "google-generative-ai")
    assert.equal(result.contextWindow, 1_000_000)
    assert.deepEqual(result.input, ["text", "image"])
  })

  it("converts an OpenAI model", () => {
    const input: OpenModelApiModel = {
      id: "gpt-5.4-mini",
      object: "model",
      created: 1778212187,
      owned_by: "openai",
      supported_protocols: ["responses"],
    }

    const result = parseApiModel(input)
    assert.ok(result)
    assert.equal(result.id, "gpt-5.4-mini")
    assert.equal(result.api, "openai-responses")
    assert.equal(result.contextWindow, 128_000)
    assert.equal(result.reasoning, false) // mini models don't support reasoning
  })

  it("converts a DashScope model with dual protocols", () => {
    const input: OpenModelApiModel = {
      id: "qwen3.7-max",
      object: "model",
      created: 1780321625,
      owned_by: "dashscope",
      supported_protocols: ["messages", "responses"],
    }

    const result = parseApiModel(input)
    assert.ok(result)
    assert.equal(result.id, "qwen3.7-max")
    // Should prefer messages over responses
    assert.equal(result.api, "anthropic-messages")
    assert.deepEqual(result.input, ["text", "image"])
  })

  it("skips image-only models", () => {
    const input: OpenModelApiModel = {
      id: "1024-x-1024/gpt-image-1.5",
      object: "model",
      created: 1781680144,
      owned_by: "openai",
      supported_protocols: ["images"],
    }

    const result = parseApiModel(input)
    assert.equal(result, null)
  })

  it("rejects unexpected API shapes", () => {
    const input = {
      id: "test",
      object: "model",
      created: 0,
      owned_by: "unknown",
      supported_protocols: ["weird-protocol"],
    } as any

    const result = parseApiModel(input)
    assert.equal(result, null)
  })
})
