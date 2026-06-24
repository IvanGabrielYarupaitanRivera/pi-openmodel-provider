/**
 * Protocol detection and thinking level mapping per provider.
 *
 * Determines the correct pi protocol (anthropic-messages, openai-responses,
 * google-generative-ai) based on provider protocol lists and fallback inference.
 */

export type ApiProtocol = "anthropic-messages" | "openai-responses" | "google-generative-ai"

/** Infer protocol from a list of supported protocol strings */
export function determineApi(
  protocols: string[],
  _provider: string,
): ApiProtocol | null {
  if (protocols.includes("messages")) return "anthropic-messages"
  if (protocols.includes("responses")) return "openai-responses"
  if (protocols.includes("gemini")) return "google-generative-ai"
  return null
}

/** Fallback: infer API protocol from provider name when legacy endpoint fails */
export function inferApiFromProvider(providerKey: string): ApiProtocol {
  if (["openai"].includes(providerKey)) return "openai-responses"
  if (["gemini"].includes(providerKey)) return "google-generative-ai"
  return "anthropic-messages"
}

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh"

/** Build a thinking-level map appropriate for the protocol */
export function thinkingLevelMapForApi(
  api: ApiProtocol,
): Partial<Record<ThinkingLevel, string | null>> {
  if (api === "anthropic-messages") {
    return {
      minimal: "low",
      low: "medium",
      medium: "high",
      high: "high",
      xhigh: "max",
    }
  }
  if (api === "openai-responses") {
    return {
      minimal: "low",
      low: "low",
      medium: "medium",
      high: "high",
      xhigh: "high",
    }
  }
  return {}
}
