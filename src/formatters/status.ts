/**
 * Formatters for the /openmodel provider status display.
 *
 * Pure functions — no side effects, no network calls.
 */

export interface ProviderStatusOptions {
  count: number
  fromCache: boolean
  hasApiKey: boolean
  modelError: string | null
}

/**
 * Format the full /openmodel status display including hints.
 */
export function formatProviderStatus(options: ProviderStatusOptions): string {
  const { count, fromCache, hasApiKey, modelError } = options

  const lines = [
    "╔══════════════════════════════════╗",
    "║        OpenModel.ai              ║",
    "╠══════════════════════════════════╣",
    `║  Models: ${String(count).padStart(3)} loaded${fromCache ? " (cached)" : ""}         ║`,
    hasApiKey ? "║  API Key: ✅ Configured              ║" : "║  API Key: ❌ Not configured          ║",
    "╠══════════════════════════════════╣",
    "║  Commands:                       ║",
    "║  /model openmodel/...            ║",
    "║  /openmodel-stability            ║",
    "╚══════════════════════════════════╝",
  ]

  const hints: string[] = []
  if (!hasApiKey) {
    hints.push("ℹ️  Run /login → OpenModel → paste your API key")
  }
  if (count === 0 && hasApiKey) {
    hints.push("ℹ️  Run /reload after setting your API key")
  }
  if (count === 0 && modelError) {
    hints.push(`ℹ️  ${modelError}`)
  }
  hints.push("ℹ️  Press Ctrl+L to select a model")

  return [...lines, ...hints].join("\n")
}
