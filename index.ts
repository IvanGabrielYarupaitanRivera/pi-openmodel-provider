/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/models.ts"
import { login, refreshToken, getApiKey } from "./src/auth.ts"
import { readFileSync } from "fs"

function getApiKeyFromAuth(): string | null {
  try {
    const authPath = "/c/Users/Admin/.pi/agent/auth.json"
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

  try {
    models = await fetchOpenModelModels({ apiKey: apiKey ?? undefined })
  } catch (e) {
    console.log("[OpenModel] Models will load after API key is configured")
  }

  pi.registerProvider("openmodel", {
    name: "OpenModel",
    baseUrl: "https://api.openmodel.ai",
    apiKey: "$OPENMODEL_API_KEY",
    oauth: {
      name: "OpenModel",
      login,
      refreshToken,
      getApiKey,
    },
    models: models.map((model) => ({
      id: model.id,
      name: model.name,
      reasoning: model.reasoning,
      input: model.input,
      cost: model.cost,
      contextWindow: model.contextWindow,
      maxTokens: model.maxTokens,
    })),
  })
}