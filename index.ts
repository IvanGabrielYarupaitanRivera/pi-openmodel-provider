/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/models.ts"
import { login, refreshToken, getApiKey } from "./src/auth.ts"
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
  formatHealthStatus,
} from "./src/stability.ts"
import { readFileSync } from "node:fs"

function getApiKeyFromAuth(): string | null {
  try {
    const authPath = "C:/Users/Admin/.pi/agent/auth.json"
    const content = readFileSync(authPath, "utf-8")
    const data = JSON.parse(content)
    return data.openmodel?.access || data.openmodel?.refresh || null
  } catch {
    return null
  }
}

export default async function (pi: ExtensionAPI) {
  let models: Awaited<ReturnType<typeof fetchOpenModelModels>> = []
  const apiKey = getApiKeyFromAuth()

  if (apiKey) {
    try {
      models = await fetchOpenModelModels({ apiKey })
    } catch {
      // Models will load after API key is configured
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
    models: models.map((model) => ({
      id: model.id,
      name: model.name,
      api: model.api,
      reasoning: model.reasoning,
      input: model.input,
      cost: model.cost,
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
    })),
  })

  // /openmodel - Show provider status
  pi.registerCommand("openmodel", {
    description: "Show OpenModel provider status",
    handler: async (_args: string, ctx: any) => {
      const key = getApiKeyFromAuth()
      const status = key ? "✅ Configured" : "❌ Not configured"
      const count = models.length

      const lines = [
        "╔════════════════════════════════╗",
        "║        OpenModel.ai            ║",
        "╠════════════════════════════════╣",
        `║  Status: ${status.padEnd(20)}║`,
        `║  Models: ${String(count).padStart(3)} available           ║`,
        "╠════════════════════════════════╣",
        "║  Commands:                     ║",
        "║  /model openmodel/...          ║",
        "║  /openmodel-stability          ║",
        "╚════════════════════════════════╝",
      ]
      ctx.ui.notify(lines.join("\n"), "info")
    },
  })

  // /openmodel-stability - Show model health metrics
  pi.registerCommand("openmodel-stability", {
    description: "Show model stability metrics (24h)",
    handler: async (args: string | undefined, ctx: any) => {
      try {
        if (args?.trim()) {
          const name = args.trim()
          const detail = await fetchModelStabilityDetail(name)
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
          const summary = await fetchModelStabilitySummary()
          if (summary.length === 0) {
            ctx.ui.notify("No stability data available.", "warning")
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
      } catch {
        ctx.ui.notify("Failed to fetch stability data.", "error")
      }
    },
  })
}
