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

export default async function (pi: ExtensionAPI) {
  // Register OpenModel as a single provider (not three separate ones)
  // This prevents duplicate entries in /login

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
    models: [], // Empty initially, will be populated after login
  });
}