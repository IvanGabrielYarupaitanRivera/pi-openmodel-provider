/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's public API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/api/models.ts"
import { login, refreshToken, getApiKey, hasApiKey } from "./src/auth/login.ts"
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
} from "./src/api/stability.ts"
import {
  formatStabilityDetail,
  formatStabilitySummaryLine,
} from "./src/formatters/stability.ts"
import { formatProviderStatus } from "./src/formatters/status.ts"
import { readModelCache, writeModelCache } from "./src/cache.ts"

/** Minimal command context type for pi extension command handlers. */
interface CommandContext {
  signal?: AbortSignal
  ui: {
    notify(message: string, type: string): void
  }
}

export default async function (pi: ExtensionAPI) {
  let models: Awaited<ReturnType<typeof fetchOpenModelModels>> = []
  let modelError: string | null = null
  let fromCache = false

  // Try local cache first to avoid hitting the API on every startup
  const cached = await readModelCache()
  if (cached) {
    models = cached
    fromCache = true
  } else {
    try {
      models = await fetchOpenModelModels()
      // Fire-and-forget cache write (failures are silently ignored)
      writeModelCache(models)
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        modelError = "🌐 Network error: check your internet connection"
      } else {
        modelError = `⚠️ ${error instanceof Error ? error.message : "Could not load models"}`
      }
    }
  }

  pi.registerProvider("openmodel", {
    name: "OpenModel",
    baseUrl: "https://api.openmodel.ai",
    apiKey: "$OPENMODEL_API_KEY",
    api: "anthropic-messages",
    oauth: {
      name: "OpenModel",
      login,
      refreshToken,
      getApiKey,
    },
    models: models.map((model) => {
      const config: Record<string, unknown> = {
        id: model.id,
        name: model.name,
        api: model.api,
        reasoning: model.reasoning,
        input: model.input,
        cost: model.cost,
        contextWindow: model.contextWindow,
        maxTokens: model.maxTokens,
      }
      if (model.thinkingLevelMap) {
        config.thinkingLevelMap = model.thinkingLevelMap
      }
      if (model.compat) {
        config.compat = model.compat
      }
      return config
    }),
  })

  // /openmodel - Show provider status
  pi.registerCommand("openmodel", {
    description: "Show OpenModel provider status",
    handler: async (_args: string, ctx: CommandContext) => {
      ctx.ui.notify(
        formatProviderStatus({
          count: models.length,
          fromCache,
          hasApiKey: await hasApiKey(),
          modelError,
        }),
        "info",
      )
    },
  })

  // /openmodel-stability - Show model health metrics
  pi.registerCommand("openmodel-stability", {
    description: "Show model stability metrics (24h)",
    handler: async (args: string | undefined, ctx: CommandContext) => {
      try {
        const fetchOptions = ctx.signal ? { signal: ctx.signal } : {}
        if (args?.trim()) {
          const name = args.trim()
          const detail = await fetchModelStabilityDetail(name, fetchOptions)
          ctx.ui.notify(formatStabilityDetail(detail), "info")
        } else {
          const summary = await fetchModelStabilitySummary(fetchOptions)
          if (summary.length === 0) {
            ctx.ui.notify("📊 No stability data available for any model yet.", "warning")
            return
          }
          const lines = ["📊 OpenModel Stability (24h)", "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"]
          const sorted = [...summary].sort((a, b) => {
            const order = { operational: 0, healthy: 1, degraded: 2, unstable: 3, no_data: 4 }
            return (order[a.health_status] ?? 5) - (order[b.health_status] ?? 5)
          })
          for (const s of sorted) {
            lines.push(formatStabilitySummaryLine(s))
          }
          ctx.ui.notify(lines.join("\n"), "info")
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error"
        ctx.ui.notify(`❌ ${msg}`, "error")
      }
    },
  })
}
