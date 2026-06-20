/**
 * OpenModel provider for pi - KISS
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";
import { fetchOpenModelModels } from "./src/models.js";

export default async function (pi: ExtensionAPI) {
  // Register OpenModel provider with OAuth
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
  });

  // Load models after registration
  try {
    const models = await fetchOpenModelModels();
    console.log(`[OpenModel] Loaded ${models.length} models`);

    // Register models
    pi.registerProvider("openmodel", {
      name: "OpenModel",
      baseUrl: "https://api.openmodel.ai",
      apiKey: "$OPENMODEL_API_KEY",
      api: "anthropic-messages",
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        reasoning: m.reasoning,
        input: m.input as any,
        cost: m.cost,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
      })),
    });

    console.log(`[OpenModel] Models registered`);
  } catch (error) {
    console.error("[OpenModel] Failed to load models:", error);
  }
}