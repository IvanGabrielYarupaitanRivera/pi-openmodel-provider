/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's public API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/api/models.ts"
import { login, refreshToken, getApiKey } from "./src/auth/login.ts"
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
} from "./src/api/stability.ts"
import { formatHealthStatus } from "./src/formatters/stability.ts"
import { readModelCache, writeModelCache } from "./src/cache.ts"
import { readFile } from "node:fs/promises"
import { homedir } from "node:os"

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
    handler: async (_args: string, ctx: any) => {
      const count = models.length

      // Detect if user has configured an API key in auth.json
      let hasApiKey = false
      try {
        const authPath = `${homedir()}/.pi/agent/auth.json`
        const content = await readFile(authPath, "utf-8")
        const data = JSON.parse(content)
        hasApiKey = !!(data.openmodel?.access || data.openmodel?.refresh)
      } catch {
        // Auth file not found
      }

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

      ctx.ui.notify([...lines, ...hints].join("\n"), "info")
    },
  })

  // /openmodel-stability - Show model health metrics
  pi.registerCommand("openmodel-stability", {
    description: "Show model stability metrics (24h)",
    handler: async (args: string | undefined, ctx: any) => {
      try {
        if (args?.trim()) {
          const name = args.trim()
          const detail = await fetchModelStabilityDetail(name, { signal: ctx.signal })
          const lines = [
            `📊 ${detail.model_name}`,
            `━━━━━━━━━━━━━━━━━━━━━━`,
            `Health:     ${formatHealthStatus(detail.health_status)}`,
            `Success:    ${detail.summary.success_rate.toFixed(2)}%`,
            `Latency:    ${detail.summary.avg_latency_ms.toFixed(0)}ms`,
            `TTFT:       ${detail.summary.avg_ttft_ms.toFixed(0)}ms`,
            `Throughput: ${detail.summary.avg_tps.toFixed(1)} t/s`,
            `Confidence: ${detail.confidence}`,
          ]
          ctx.ui.notify(lines.join("\n"), "info")
        } else {
          const summary = await fetchModelStabilitySummary({ signal: ctx.signal })
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
            const emoji = formatHealthStatus(s.health_status).split(" ")[0]
            lines.push(`${emoji} ${s.model_name.padEnd(28)} ${s.success_rate.toFixed(1).padStart(5)}%  ${s.avg_latency_ms.toFixed(0).padStart(5)}ms  ${s.avg_tps.toFixed(1).padStart(6)} t/s`)
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
