/**
 * OpenModel provider for pi.
 *
 * Connects pi to OpenModel.ai's gateway API.
 * Supports models from 8+ providers through 3 API protocols.
 *
 * Features:
 *   🔄 Dynamic model discovery from OpenModel API
 *   🔐 OAuth login via /login openmodel
 *   📊 Model stability metrics via /openmodel-stability
 *   🩺 Health status indicators on model names
 *
 * Quick start:
 *   1. Set OPENMODEL_API_KEY env var, OR
 *   2. Run /login openmodel and paste your API key
 *   3. pi --model openmodel/deepseek-v4-flash
 */

import type {
  ExtensionAPI,
  ProviderModelConfig,
} from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";
import { fetchOpenModelModels } from "./src/models.js";
import {
  fetchModelStabilitySummary,
  formatHealthStatus,
  type HealthStatus,
} from "./src/stability.js";

let openmodelProvider: any = null;
let modelsLoaded = false;

async function loadOpenModelModels(pi: ExtensionAPI) {
  if (modelsLoaded) return;

  try {
    console.log("[OpenModel] Loading models...")

    const [models, stabilityMap] = await Promise.all([
      fetchOpenModelModels(),
      fetchModelStabilitySummary().catch(() => [] as Array<{ model_name: string; health_status: HealthStatus }>),
    ]);

    console.log(`[OpenModel] Loaded ${models.length} models`)

    const stabilityByModel = new Map(
      stabilityMap.map((s) => [s.model_name, s.health_status]),
    );

    const messagesModels: ProviderModelConfig[] = [];
    const responsesModels: ProviderModelConfig[] = [];
    const geminiModels: ProviderModelConfig[] = [];

    for (const m of models) {
      const health = stabilityByModel.get(m.id);
      const healthPrefix = health
        ? `${formatHealthStatus(health).split(" ")[0]} `
        : "";

      const config: ProviderModelConfig = {
        id: m.id,
        name: `${healthPrefix}${m.id}`,
        reasoning: m.reasoning,
        input: m.input as any,
        cost: m.cost,
        contextWindow: m.contextWindow,
        maxTokens: m.maxTokens,
      };

      if (m.api === "anthropic-messages") {
        messagesModels.push(config);
      } else if (m.api === "openai-responses") {
        responsesModels.push(config);
      } else if (m.api === "google-generative-ai") {
        geminiModels.push(config);
      }
    }

    // Update the provider with loaded models
    if (openmodelProvider) {
      openmodelProvider.models = [...messagesModels, ...responsesModels, ...geminiModels];
      console.log(`[OpenModel] Updated provider with ${messagesModels.length + responsesModels.length + geminiModels.length} models`);
    }

    modelsLoaded = true;
  } catch (error) {
    console.error("[OpenModel] Failed to load models:", error);
  }
}

export default async function (pi: ExtensionAPI) {
  console.log("[OpenModel] Registering provider...");

  openmodelProvider = pi.registerProvider("openmodel", {
    name: "OpenModel",
    baseUrl: "https://api.openmodel.ai",
    apiKey: "$OPENMODEL_API_KEY",
    oauth: {
      name: "OpenModel",
      login,
      refreshToken,
      getApiKey,
    },
    models: [], // Empty initially
  });

  // Load models after provider is registered
  await loadOpenModelModels(pi);
}

// Load models on session start
pi.on("session_start", async (_event, ctx) => {
  if (modelsLoaded) return;
  await loadOpenModelModels(pi);
});