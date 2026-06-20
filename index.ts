/**
 * OpenModel provider for pi - KISS
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";
import { fetchOpenModelModels } from "./src/models.js";

export default function (pi: ExtensionAPI) {
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
}

// Load models when API key exists
pi.on("session_start", async (_event, ctx) => {
  try {
    // Check if API key exists
    let apiKey = undefined;
    try {
      const auth = require("fs").readFileSync("/c/Users/Admin/.pi/agent/auth.json", "utf8");
      const authData = JSON.parse(auth);
      apiKey = authData.openmodel?.access || authData.openmodel?.refresh;
    } catch (e) {
      // Not found
    }

    if (!apiKey) {
      console.log("[OpenModel] API key not found in auth.json");
      return;
    }

    const models = await fetchOpenModelModels();
    console.log(`[OpenModel] Loaded ${models.length} models`);

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
});