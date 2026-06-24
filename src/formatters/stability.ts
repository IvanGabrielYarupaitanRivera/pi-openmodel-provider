/**
 * Formatters for model stability presentation.
 *
 * Pure functions — no side effects, no network calls.
 * Transforms health/confidence data into display-ready strings.
 */

import type { HealthStatus, ConfidenceLevel } from "../api/stability.ts"

/** Determine health status from success rate and confidence */
export function determineHealth(
  successRate: number,
  confidence: ConfidenceLevel,
): HealthStatus {
  if (confidence === "low") return "no_data"
  if (successRate >= 99.9) return "operational"
  if (successRate >= 99) return "healthy"
  if (successRate >= 95) return "degraded"
  return "unstable"
}

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
