import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { sanitizeApiKey, isValidApiKey } from "../src/auth/validate.ts"

describe("sanitizeApiKey()", () => {
  it("removes terminal paste wrappers", () => {
    const input = "\x1b[200~om-abc123\x1b[201~"
    assert.equal(sanitizeApiKey(input), "om-abc123")
  })

  it("removes non-bracket-style wrappers", () => {
    const input = "[200~om-abc123[201~"
    assert.equal(sanitizeApiKey(input), "om-abc123")
  })

  it("removes control characters", () => {
    const input = "om-abc\u0000\u0001\u0002def"
    assert.equal(sanitizeApiKey(input), "om-abcdef")
  })

  it("trims whitespace", () => {
    const input = "  om-abc123  \n"
    assert.equal(sanitizeApiKey(input), "om-abc123")
  })

  it("returns empty string for empty input", () => {
    assert.equal(sanitizeApiKey(""), "")
  })
})

describe("isValidApiKey()", () => {
  it("accepts valid om- prefixed keys", () => {
    assert.equal(isValidApiKey("om-abc123"), true)
    assert.equal(isValidApiKey("om-ApRQ2DRocQqsQ7HWt8FYxmsPsP65Bk24NtdKg"), true)
    assert.equal(isValidApiKey("om-ABC-123_xyz"), true)
  })

  it("rejects keys without om- prefix", () => {
    assert.equal(isValidApiKey("sk-abc123"), false)
    assert.equal(isValidApiKey("abc-om-123"), false)
  })

  it("rejects empty keys", () => {
    assert.equal(isValidApiKey(""), false)
  })

  it("rejects keys with invalid characters", () => {
    assert.equal(isValidApiKey("om-abc 123"), false)
    assert.equal(isValidApiKey("om-abc\n123"), false)
  })
})
