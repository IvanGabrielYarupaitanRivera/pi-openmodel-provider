/**
 * OpenModel provider for pi - KISS
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { login, refreshToken, getApiKey } from "./src/auth.js";

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