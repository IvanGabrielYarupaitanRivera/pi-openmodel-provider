/**
 * OpenModel.ai Model Stability API client.
 *
 * Fetches real-time stability metrics (success rate, latency, throughput)
 * for all models. Publicly accessible without authentication.
 *
 * Reference:
 *   GET https://api.openmodel.ai/web/v1/model-stability/summary
 *   GET https://api.openmodel.ai/web/v1/model-stability/:modelKey
 *
 * This module is pure fetching — formatting is in formatters/stability.ts.
 */

import { parseWebError, friendlyMessage } from "../errors.ts"
import { determineHealth } from "../health.ts"
import type { HealthStatus } from "../health.ts"

export const STABILITY_SUMMARY_URL =
  "https://api.openmodel.ai/web/v1/model-stability/summary"

/** Confidence level based on sample size */
export type ConfidenceLevel = "high" | "medium" | "low"

/** Stability summary for a single model */
export interface ModelStability {
  model_name: string
  success_rate: number
  avg_latency_ms: number
  avg_tps: number
  confidence: ConfidenceLevel
  health_status: HealthStatus
}

/** Stability summary for a single model with time series */
export interface ModelStabilityDetail {
  model_name: string
  confidence: ConfidenceLevel
  summary: {
    success_rate: number
    avg_latency_ms: number
    avg_ttft_ms: number
    avg_tps: number
  }
  series: Array<{
    ts: number
    success_rate: number
    avg_latency_ms: number
    avg_ttft_ms: number
    avg_tps: number
    confidence: ConfidenceLevel
  }>
  updated_at: number
  health_status: HealthStatus
}

/** Fetch stability summary for all models */
export async function fetchModelStabilitySummary(options?: {
  url?: string
  fetchImpl?: typeof fetch
  hours?: number
  signal?: AbortSignal
}): Promise<ModelStability[]> {
  const url = options?.url ?? STABILITY_SUMMARY_URL
  const fetchImpl = options?.fetchImpl ?? fetch
  const hours = options?.hours ?? 24

  const params = new URLSearchParams({ hours: String(hours) })
  const response = await fetchImpl(`${url}?${params}`, {
    headers: { accept: "application/json" },
    signal: options?.signal ?? null,
  })

  if (!response.ok) {
    let errBody: any
    try { errBody = await response.json() } catch {}
    const err = parseWebError(errBody)
    throw new Error(`stability — ${friendlyMessage(err.code, err.message)}`)
  }

  const body = (await response.json()) as {
    success: boolean
    data: Array<{
      model_name: string
      success_rate: number
      avg_latency_ms: number
      avg_tps: number
      confidence: ConfidenceLevel
    }>
  }

  if (!body.success) {
    throw new Error(`stability — ${friendlyMessage("INTERNAL_ERROR", "Summary request failed")}`)
  }

  return body.data.map((item) => ({
    ...item,
    health_status: determineHealth(item.success_rate, item.confidence),
  }))
}

/** Fetch stability detail for a specific model */
export async function fetchModelStabilityDetail(
  modelKey: string,
  options?: {
    fetchImpl?: typeof fetch
    hours?: number
    signal?: AbortSignal
  },
): Promise<ModelStabilityDetail> {
  const fetchImpl = options?.fetchImpl ?? fetch
  const hours = options?.hours ?? 24

  const params = new URLSearchParams({ hours: String(hours) })
  const response = await fetchImpl(
    `https://api.openmodel.ai/web/v1/model-stability/${encodeURIComponent(modelKey)}?${params}`,
    {
      headers: { accept: "application/json" },
      signal: options?.signal ?? null,
    },
  )

  if (!response.ok) {
    let errBody: any
    try { errBody = await response.json() } catch {}
    const err = parseWebError(errBody)
    throw new Error(`stability — ${friendlyMessage(err.code, err.message)}`)
  }

  const body = (await response.json()) as {
    success: boolean
    data: {
      model_name: string
      confidence: ConfidenceLevel
      summary: {
        success_rate: number
        avg_latency_ms: number
        avg_ttft_ms: number
        avg_tps: number
      }
      series: Array<{
        ts: number
        success_rate: number
        avg_latency_ms: number
        avg_ttft_ms: number
        avg_tps: number
        confidence: ConfidenceLevel
      }>
      updated_at: number
    }
  }

  if (!body.success) {
    throw new Error(`stability — ${friendlyMessage("NOT_FOUND", `Model "${modelKey}" not found`)}`)
  }

  return {
    ...body.data,
    health_status: determineHealth(
      body.data.summary.success_rate,
      body.data.confidence,
    ),
  }
}
