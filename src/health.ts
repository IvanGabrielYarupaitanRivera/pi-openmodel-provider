/**
 * Shared health status determination for model stability.
 *
 * Extracted from stability.ts and formatters/stability.ts to avoid
 * code duplication — both modules need the same logic.
 */

import type { ConfidenceLevel } from "./api/stability.ts"

export type HealthStatus =
  | "operational"
  | "healthy"
  | "degraded"
  | "unstable"
  | "no_data"

/**
 * Determine health status from success rate and confidence.
 * Low confidence → no_data regardless of success rate.
 */
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
