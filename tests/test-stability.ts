import assert from "node:assert/strict"
import { describe, it, mock } from "node:test"

import {
  formatHealthStatus,
  formatConfidence,
} from "../src/formatters/stability.ts"
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
} from "../src/api/stability.ts"

describe("formatHealthStatus()", () => {
  it('returns ✅ Operational for operational status', () => {
    assert.equal(formatHealthStatus("operational"), "✅ Operational")
  })

  it('returns 🟢 Healthy for healthy status', () => {
    assert.equal(formatHealthStatus("healthy"), "🟢 Healthy")
  })

  it('returns 🟡 Degraded for degraded status', () => {
    assert.equal(formatHealthStatus("degraded"), "🟡 Degraded")
  })

  it('returns 🔴 Unstable for unstable status', () => {
    assert.equal(formatHealthStatus("unstable"), "🔴 Unstable")
  })

  it('returns ⚪ No Data for no_data status', () => {
    assert.equal(formatHealthStatus("no_data"), "⚪ No Data")
  })
})

describe("formatConfidence()", () => {
  it('returns 🟢 High for high confidence', () => {
    assert.equal(formatConfidence("high"), "🟢 High")
  })

  it('returns 🟡 Medium for medium confidence', () => {
    assert.equal(formatConfidence("medium"), "🟡 Medium")
  })

  it('returns ⚪ Low for low confidence', () => {
    assert.equal(formatConfidence("low"), "⚪ Low")
  })
})

describe("fetchModelStabilitySummary()", () => {
  it("parses a valid API response and assigns health status", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            model_name: "deepseek-v4-flash",
            success_rate: 99.95,
            avg_latency_ms: 8541,
            avg_tps: 136.4,
            confidence: "high",
          },
          {
            model_name: "claude-sonnet-4-6",
            success_rate: 99.5,
            avg_latency_ms: 4302,
            avg_tps: 105.4,
            confidence: "high",
          },
          {
            model_name: "unstable-model",
            success_rate: 94.0,
            avg_latency_ms: 9999,
            avg_tps: 10,
            confidence: "medium",
          },
          {
            model_name: "no-data-model",
            success_rate: 100.0,
            avg_latency_ms: 0,
            avg_tps: 0,
            confidence: "low",
          },
        ],
      }),
    })) as unknown as typeof fetch

    const result = await fetchModelStabilitySummary({ fetchImpl: mockFetch })

    assert.equal(result.length, 4)
    assert.equal(result[0]!.health_status, "operational") // 99.95% >= 99.9
    assert.equal(result[1]!.health_status, "healthy")     // 99.5% >= 99
    assert.equal(result[2]!.health_status, "unstable")    // 94% < 95
    assert.equal(result[3]!.health_status, "no_data")     // low confidence
  })

  it("throws when API returns success: false", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({ success: false, data: [] }),
    })) as unknown as typeof fetch

    await assert.rejects(
      () => fetchModelStabilitySummary({ fetchImpl: mockFetch }),
      (err: Error) => err.message.includes("stability"),
    )
  })

  it("uses default hours when not provided", async () => {
    let capturedUrl = ""
    const mockFetch = mock.fn(async (url: string) => {
      capturedUrl = url as string
      return {
        ok: true,
        json: async () => ({ success: true, data: [] }),
      }
    }) as unknown as typeof fetch

    await fetchModelStabilitySummary({ fetchImpl: mockFetch })
    assert.ok(capturedUrl.includes("hours=24"))
  })
})

describe("fetchModelStabilityDetail()", () => {
  it("parses a valid detail response and assigns health status", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          model_name: "deepseek-v4-flash",
          confidence: "high",
          summary: {
            success_rate: 99.85,
            avg_latency_ms: 1234,
            avg_ttft_ms: 380,
            avg_tps: 87.3,
          },
          series: [
            {
              ts: 1717459200,
              success_rate: 100.0,
              avg_latency_ms: 1100,
              avg_ttft_ms: 350,
              avg_tps: 90.0,
              confidence: "high",
            },
          ],
          updated_at: 1717462800,
        },
      }),
    })) as unknown as typeof fetch

    const result = await fetchModelStabilityDetail("deepseek-v4-flash", {
      fetchImpl: mockFetch,
    })

    assert.equal(result.model_name, "deepseek-v4-flash")
    assert.equal(result.health_status, "healthy") // 99.85% >= 99%
    assert.equal(result.summary.success_rate, 99.85)
    assert.equal(result.summary.avg_ttft_ms, 380)
    assert.equal(result.series.length, 1)
    assert.equal(result.series[0]!.avg_tps, 90.0)
  })

  it("throws for invalid model name", async () => {
    const mockFetch = mock.fn(async () => ({
      ok: true,
      json: async () => ({
        success: false,
        data: null,
      }),
    })) as unknown as typeof fetch

    await assert.rejects(
      () => fetchModelStabilityDetail("invalid-model", { fetchImpl: mockFetch }),
      (err: Error) => err.message.includes("stability"),
    )
  })
})
