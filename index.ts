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

import { login, refreshToken, getApiKey } from "src/auth.js";

export default async function (pi: ExtensionAPI) {
  // Register providers WITHOUT models initially (they'll be fetched after auth)
  // This prevents 401 errors on startup and makes /login appear correctly

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
    models: [], // Empty initially, will be populated after login
  });

  pi.registerProvider("openmodel-responses", {
    name: "OpenModel",
    baseUrl: "https://api.openmodel.ai",
    apiKey: "$OPENMODEL_API_KEY",
    api: "openai-responses",
    oauth: {
      name: "OpenModel",
      login,
      refreshToken,
      getApiKey,
    },
    models: [],
  });

  pi.registerProvider("openmodel-gemini", {
    name: "OpenModel",
    baseUrl: "https://api.openmodel.ai",
    apiKey: "$OPENMODEL_API_KEY",
    api: "google-generative-ai",
    oauth: {
      name: "OpenModel",
      login,
      refreshToken,
      getApiKey,
    },
    models: [],
  });

  // TODO: Add a command to fetch models after login
  // This will populate the models array dynamically
}
