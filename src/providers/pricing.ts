/**
 * Pricing utilities for converting cost-per-token to $/M tokens.
 *
 * OpenModel API returns prices in cost-per-token (microdollars).
 * We convert to dollars per million tokens for pi's display.
 */

/** Convert cost-per-token to dollars per million tokens */
export function pricePerMillion(costPerToken: number | undefined): number {
  if (costPerToken === undefined || costPerToken === null) return 0
  return Math.round(costPerToken * 1_000_000 * 1000) / 1000
}
