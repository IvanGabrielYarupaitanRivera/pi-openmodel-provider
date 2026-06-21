import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { parseApiModel } from "../src/models.ts"
import type { OpenModelApiModel } from "../src/models.ts"

describe("Model pricing inference", () => {
  it("infers DeepSeek V4 Flash pricing correctly", () => {
    const model = parseApiModel({
      id: "deepseek-v4-flash",
      object: "model",
      created: 1778315466,
      owned_by: "deepseek",
      supported_protocols: ["messages"],
    })

    assert.ok(model)
    assert.equal(model.cost.input, 0.14)
    assert.equal(model.cost.output, 0.28)
  })

  it("infers Anthropic Claude pricing correctly", () => {
    const model = parseApiModel({
      id: "claude-sonnet-4-6",
      object: "model",
      created: 1778212220,
      owned_by: "anthropic",
      supported_protocols: ["messages"],
    })

    assert.ok(model)
    // Anthropic default pricing (overridden for known models)
    assert.equal(model.cost.input, 3)
    assert.equal(model.cost.output, 15)
  })

  it("infers Gemini pricing correctly", () => {
    const model = parseApiModel({
      id: "gemini-3.5-flash",
      object: "model",
      created: 1779253516,
      owned_by: "gemini",
      supported_protocols: ["gemini"],
    })

    assert.ok(model)
    assert.equal(model.cost.input, 0.30)
    assert.equal(model.cost.output, 1.20)
  })

  it("has cache pricing for all models", () => {
    const models = [
      { id: "deepseek-v4-flash", owned_by: "deepseek" },
      { id: "claude-sonnet-4-6", owned_by: "anthropic" },
      { id: "gpt-5.4", owned_by: "openai" },
    ]

    for (const { id, owned_by } of models) {
      const model = parseApiModel({
        id,
        object: "model",
        created: 0,
        owned_by,
        supported_protocols: ["messages"],
      })

      assert.ok(model, `Model ${id} should parse`)
      assert.ok(model.cost.cacheRead >= 0, `CacheRead should be >= 0 for ${id}`)
      assert.ok(model.cost.cacheWrite >= 0, `CacheWrite should be >= 0 for ${id}`)
    }
  })

  it("falls back to zero cost for unknown models", () => {
    const model = parseApiModel({
      id: "unknown-model-v1",
      object: "model",
      created: 0,
      owned_by: "unknown-provider",
      supported_protocols: ["messages"],
    })

    assert.ok(model)
    assert.equal(model.cost.input, 0)
    assert.equal(model.cost.output, 0)
  })
})
