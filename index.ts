/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/models.ts"
import { login, refreshToken, getApiKey } from "./src/auth.ts"
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
    description: "Show model stability metrics",
    handler: async (_args: string | undefined, ctx: any) => {
      ctx.ui.notify("Feature coming soon!", "info")
    },
  })
}