/**
 * OpenModel provider for pi.
 *
 * Connects pi to OpenModel.ai's gateway API.
 * Supports models from 8+ providers through 3 API protocols:
 *   - Anthropic Messages API (Anthropic, DeepSeek, DashScope, Xiaomi, Kimi, MiniMax, Zai)
 *   - OpenAI Responses API (OpenAI, DashScope)
 *   - Google Generative AI API (Gemini)
 *
 * Models are fetched from OpenModel's API at startup.
 * Model stability data enhances model names with health status.
 *
 * Commands:
 *   /openmodel-stability         - Show stability for all models
 *   /openmodel-stability <model> - Show detailed stability for a model
 *
 * Authentication:
 *   Set OPENMODEL_API_KEY environment variable.
 */

import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent"

import { fetchOpenModelModels } from "./src/models.ts"
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
  formatHealthStatus,
  type HealthStatus,
} from "./src/stability.ts"

export default async function (pi: ExtensionAPI) {
  const apiKey = "$OPENMODEL_API_KEY"

  // Fetch models and stability data in parallel
  const [models, stabilityMap] = await Promise.all([
    fetchOpenModelModels({ apiKey: undefined }),
    fetchModelStabilitySummary().catch(() => [] as Array<{ model_name: string; health_status: HealthStatus }>),
  ])

  // Build stability lookup
  const stabilityByModel = new Map(
    stabilityMap.map((s) => [s.model_name, s.health_status]),
  )

  // Group models by API type with health status in names
  const messagesModels: ProviderModelConfig[] = []
  const responsesModels: ProviderModelConfig[] = []
  const geminiModels: ProviderModelConfig[] = []

  for (const m of models) {
    const health = stabilityByModel.get(m.id)
    const healthPrefix = health ? formatHealthStatus(health).split(" ")[0] + " " : ""

    const config: ProviderModelConfig = {
      id: m.id,
      name: `${healthPrefix}${m.id} (OpenModel)`,
      reasoning: m.reasoning,
      input: m.input,
      cost: m.cost,
      contextWindow: m.contextWindow,
      maxTokens: m.maxTokens,
    }

    if (m.api === "anthropic-messages") {
      messagesModels.push(config)
    } else if (m.api === "openai-responses") {
      responsesModels.push(config)
    } else if (m.api === "google-generative-ai") {
      geminiModels.push(config)
    }
  }

  // Register Messages protocol provider (Anthropic/DeepSeek/DashScope/Kimi/MiniMax/Zai)
  if (messagesModels.length > 0) {
    pi.registerProvider("openmodel", {
      name: "OpenModel (Messages)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "anthropic-messages",
      models: messagesModels,
    })
  }

  // Register Responses protocol provider (OpenAI models)
  if (responsesModels.length > 0) {
    pi.registerProvider("openmodel-responses", {
      name: "OpenModel (Responses)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "openai-responses",
      models: responsesModels,
    })
  }

  // Register Gemini protocol provider (Google models)
  if (geminiModels.length > 0) {
    pi.registerProvider("openmodel-gemini", {
      name: "OpenModel (Gemini)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "google-generative-ai",
      models: geminiModels,
    })
  }

  // -----------------------------------------------------------------------
  // /openmodel-stability command
  // -----------------------------------------------------------------------
  pi.registerCommand("openmodel-stability", {
    description: "Show OpenModel model stability metrics",
    handler: async (args, ctx) => {
      if (args?.trim()) {
        // Show detail for a specific model
        const modelName = args.trim()
        try {
          const detail = await fetchModelStabilityDetail(modelName)
          const lines = [
            `📊 ${detail.model_name}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `Health:   ${formatHealthStatus(detail.health_status)}`,
            `Success:  ${detail.summary.success_rate.toFixed(2)}%`,
            `Latency:  ${detail.summary.avg_latency_ms.toFixed(0)}ms`,
            `TTFT:     ${detail.summary.avg_ttft_ms.toFixed(0)}ms`,
            `Throughput: ${detail.summary.avg_tps.toFixed(1)} t/s`,
            `Confidence: ${detail.confidence}`,
            `Updated:  ${new Date(detail.updated_at * 1000).toLocaleString()}`,
            ``,
            `Hourly data (last 24h):`,
          ]
          for (const point of detail.series) {
            const time = new Date(point.ts * 1000).toLocaleTimeString()
            lines.push(`  ${time}  ${point.success_rate.toFixed(1)}%  ${point.avg_latency_ms.toFixed(0)}ms  ${point.avg_tps.toFixed(1)} t/s`)
          }
          ctx.ui.notify(lines.join("\n"), "info")
        } catch (err) {
          ctx.ui.notify(`Failed to fetch stability for "${modelName}"`, "error")
        }
      } else {
        // Show summary for all models
        try {
          const summary = await fetchModelStabilitySummary()
          if (summary.length === 0) {
            ctx.ui.notify("No stability data available.", "warning")
            return
          }
          const lines = ["📊 OpenModel Stability (24h):", ""]
          // Sort by confidence then success rate
          const sorted = [...summary].sort((a, b) => {
            const confOrder = { high: 0, medium: 1, low: 2 }
            const ac = confOrder[a.confidence] ?? 3
            const bc = confOrder[b.confidence] ?? 3
            if (ac !== bc) return ac - bc
            return b.success_rate - a.success_rate
          })
          for (const s of sorted) {
            const health = formatHealthStatus(s.health_status).split(" ")[0]
            lines.push(
              `  ${health}  ${s.model_name.padEnd(30)} ` +
              `${s.success_rate.toFixed(1)}%  ` +
              `${s.avg_latency_ms.toFixed(0)}ms  ` +
              `${s.avg_tps.toFixed(1)} t/s`,
            )
          }
          ctx.ui.notify(lines.join("\n"), "info")
        } catch (err) {
          ctx.ui.notify("Failed to fetch stability summary.", "error")
        }
      }
    },
  })
}
