/**
 * Formatters for model stability presentation.
 *
 * Pure functions — no side effects, no network calls.
 * Transforms health/confidence data into display-ready strings.
 */

import type { HealthStatus } from "../health.ts"
import type { ConfidenceLevel } from "../api/stability.ts"
import { determineHealth } from "../health.ts"

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
