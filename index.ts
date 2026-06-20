/**
 * OpenModel provider for pi - KISS
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";
import { getApiKey as getAuthApiKey } from "@earendil-works/pi-ai";
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
}

// Load models after authentication (session_start)
pi.on("session_start", async (_event, ctx) => {
  try {
    // Wait for auth to be configured
    let apiKey = process.env.OPENMODEL_API_KEY;
    if (!apiKey) {
      // Try to get from auth.json
      try {
        const auth = require("fs").readFileSync("/c/Users/Admin/.pi/agent/auth.json", "utf8");
        const authData = JSON.parse(auth);
        apiKey = authData.openmodel?.access || authData.openmodel?.refresh;
      } catch (e) {
        // Not found
      }
    }

    if (!apiKey) {
      console.log("[OpenModel] API key not configured yet")
      return
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