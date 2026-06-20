/**
 * OpenModel provider for pi - KISS version
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";

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
    models: [], // Empty initially - loaded after auth
  });
}