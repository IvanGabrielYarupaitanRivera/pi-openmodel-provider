/**
 * Formatters for model stability presentation.
 *
 * Pure functions — no side effects, no network calls.
 * Transforms health/confidence data into display-ready strings.
 */

import type { HealthStatus } from "../health.ts"
import type {
  ConfidenceLevel,
  ModelStability,
  ModelStabilityDetail,
} from "../api/stability.ts"

/** Format health status with emoji */
export function formatHealthStatus(status: HealthStatus): string {
  switch (status) {
    case "operational":
      return "✅ Operational"
    case "healthy":
      return "🟢 Healthy"
    case "degraded":
      return "🟡 Degraded"
    case "unstable":
      return "🔴 Unstable"
    case "no_data":
      return "⚪ No Data"
  }
}

/** Format confidence level */
export function formatConfidence(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "🟢 High"
    case "medium":
      return "🟡 Medium"
    case "low":
      return "⚪ Low"
  }
}

/** Format detailed stability view for a single model */
export function formatStabilityDetail(detail: ModelStabilityDetail): string {
  return [
    `📊 ${detail.model_name}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Health:     ${formatHealthStatus(detail.health_status)}`,
    `Success:    ${detail.summary.success_rate.toFixed(2)}%`,
    `Latency:    ${detail.summary.avg_latency_ms.toFixed(0)}ms`,
    `TTFT:       ${detail.summary.avg_ttft_ms.toFixed(0)}ms`,
    `Throughput: ${detail.summary.avg_tps.toFixed(1)} t/s`,
    `Confidence: ${formatConfidence(detail.confidence)}`,
  ].join("\n")
}

/** Format a single summary line for the stability list */
export function formatStabilitySummaryLine(s: ModelStability): string {
  const emoji = formatHealthStatus(s.health_status).split(" ")[0]
  return `${emoji} ${s.model_name.padEnd(28)} ${s.success_rate.toFixed(1).padStart(5)}%  ${s.avg_latency_ms.toFixed(0).padStart(5)}ms  ${s.avg_tps.toFixed(1).padStart(6)} t/s`
}
