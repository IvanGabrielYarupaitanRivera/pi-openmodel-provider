/**
 * OpenModel provider for pi.
 *
 * Models are fetched from OpenModel's API at startup.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { fetchOpenModelModels } from "./src/models.ts"
import { login, refreshToken, getApiKey } from "./src/auth.ts"

export default async function (pi: ExtensionAPI) {
  let models: Awaited<ReturnType<typeof fetchOpenModelModels>> = []

  try {
    models = await fetchOpenModelModels()
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