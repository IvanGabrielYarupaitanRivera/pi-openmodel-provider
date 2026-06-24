/**
 * Provider-specific compatibility flags for pi.
 *
 * These flags tell pi about each provider's quirks and capabilities,
 * enabling optimal protocol compatibility (thinking formats, session
 * affinity, cache control, etc.).
 */

import type { ApiProtocol } from "./protocols.ts"

/**
 * Determine compat flags based on provider and API.
 * Returns undefined when no special flags are needed.
 */
export function compatForProvider(
  providerKey: string,
  api: ApiProtocol,
  reasoning: boolean,
): Record<string, unknown> | undefined {
  switch (providerKey) {
    case "openai":
      return { supportsReasoningEffort: true }

    case "deepseek":
      if (reasoning) return { thinkingFormat: "deepseek" }
      return undefined

    case "anthropic":
      return {
        sendSessionAffinityHeaders: true,
        supportsCacheControlOnTools: true,
        supportsEagerToolInputStreaming: true,
      }

    case "google":
    case "gemini":
      return undefined

    case "qwen":
      if (reasoning) return { thinkingFormat: "qwen-chat-template" }
      return undefined

    case "zai":
      if (reasoning) return { thinkingFormat: "zai" }
      return undefined

    default:
      return undefined
  }
}
