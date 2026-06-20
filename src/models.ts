/**
 * OpenModel.ai model fetching and parsing.
 *
 * Fetches available models from OpenModel's API endpoint
 * and maps them to pi provider model definitions.
 */

export const DEFAULT_MODELS_URL = "https://api.openmodel.ai/v1/models"
export const DEFAULT_API_BASE = "https://api.openmodel.ai"

/** Supported protocols from OpenModel API */
type SupportedProtocol = "messages" | "responses" | "gemini" | "images"

/** Raw model from OpenModel API response */
interface OpenModelApiModel {
  id: string
  object: string
  created: number
  owned_by: string
  supported_protocols: SupportedProtocol[]
}

/** OpenModel API response shape */
interface OpenModelModelsResponse {
  data: OpenModelApiModel[]
  object: string
}

/** Mapped provider model for pi */
export interface OpenModelProviderModel {
  id: string
  name: string
  reasoning: boolean
  input: readonly ("text" | "image")[]
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number }
  contextWindow: number
  maxTokens: number
  api: "anthropic-messages" | "openai-responses" | "google-generative-ai"
}

/** Known pricing for models we recognize */
const KNOWN_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-opus-4-7":    { input: 15, output: 75 },
  "claude-opus-4-6":    { input: 15, output: 75 },
  "claude-opus-4-8":    { input: 15, output: 75 },
  "claude-sonnet-4-5":  { input: 3, output: 15 },
  "claude-sonnet-4-6":  { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },
  // DeepSeek
  "deepseek-v4-pro":    { input: 0.435, output: 0.87 },
  "deepseek-v4-flash":  { input: 0.14, output: 0.28 },
  // OpenAI
  "gpt-5.5-pro":        { input: 10, output: 40 },
  "gpt-5.5":            { input: 5, output: 20 },
  "gpt-5.4-pro":        { input: 5, output: 20 },
  "gpt-5.4":            { input: 2.5, output: 10 },
  "gpt-5.4-mini":       { input: 0.40, output: 1.60 },
  "gpt-5.3-codex":      { input: 2, output: 8 },
  "gpt-5.2-pro":        { input: 5, output: 20 },
  "gpt-5.2":            { input: 2, output: 8 },
  // Google
  "gemini-3.5-flash":   { input: 0.30, output: 1.20 },
  "gemini-3.1-pro-preview": { input: 1.50, output: 6.00 },
  "gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  // Moonshot / Kimi
  "kimi-k2.6":          { input: 0.95, output: 4 },
  "kimi-k2.5":          { input: 0.60, output: 3 },
  "kimi-k2.7-code":     { input: 0.95, output: 4 },
  // ZAI / GLM
  "glm-5.2":            { input: 1.40, output: 5.60 },
  "glm-5.1":            { input: 1.40, output: 4.40 },
  "glm-5":              { input: 1, output: 3.20 },
  "glm-4.7":            { input: 0.50, output: 2 },
  // DashScope / Qwen
  "qwen3.7-max":        { input: 2, output: 6 },
  "qwen3.6-max-preview":{ input: 1.30, output: 7.80 },
  "qwen3.6-plus":       { input: 0.50, output: 3 },
  "qwen3.6-flash":      { input: 0.20, output: 1 },
  "qwen3.5-plus":       { input: 0.50, output: 3 },
  "qwen3-max":          { input: 2.50, output: 6 },
  // MiniMax
  "MiniMax-M3":         { input: 0.50, output: 2 },
  "MiniMax-M2.7":       { input: 0.30, output: 1.20 },
  "MiniMax-M2.5":       { input: 0.27, output: 0.95 },
  // Xiaomi / MiMo
  "mimo-v2.5-pro":      { input: 0, output: 0 },
  "mimo-v2.5":          { input: 0, output: 0 },
  "mimo-v2-pro":        { input: 0, output: 0 },
  "mimo-v2-omni":       { input: 0, output: 0 },
  "mimo-v2-flash":      { input: 0, output: 0 },
}

/** Default context windows by model family */
function guessContextWindow(id: string): number {
  if (/claude|sonnet|opus|haiku/i.test(id)) return 200_000
  if (/gemini/i.test(id)) return 1_000_000
  if (/deepseek/i.test(id)) return 128_000
  if (/gpt-5/i.test(id)) return 128_000
  if (/kimi/i.test(id)) return 128_000
  if (/qwen/i.test(id)) return 131_072
  if (/glm/i.test(id)) return 128_000
  if (/MiniMax/i.test(id)) return 128_000
  if (/mimo/i.test(id)) return 128_000
  if (/gpt/i.test(id)) return 128_000
  return 128_000
}

/** Default max output tokens */
function guessMaxTokens(id: string): number {
  if (/gemini/i.test(id)) return 8_192
  if (/kimi/i.test(id)) return 65_536
  return 16_384
}

/** Determine if model supports reasoning/thinking */
function guessReasoning(id: string, owned_by: string): boolean {
  // Most models support reasoning
  if (/gemini.*flash.*lite/i.test(id)) return false
  if (/gpt.*mini/i.test(id)) return false
  return true
}

/** Determine if model supports images */
function supportsImages(id: string, owned_by: string): boolean {
  if (/claude|sonnet|opus|haiku/i.test(id)) return true
  if (/gemini/i.test(id)) return true
  if (/gpt/i.test(id)) return true
  if (/qwen/i.test(id)) return true
  if (/kimi/i.test(id)) return true
  return false
}

/** Map OpenModel protocol to pi API type */
function protocolToApi(protocols: SupportedProtocol[]): "anthropic-messages" | "openai-responses" | "google-generative-ai" | null {
  // Prioritize: messages > responses > gemini
  if (protocols.includes("messages")) return "anthropic-messages"
  if (protocols.includes("responses")) return "openai-responses"
  if (protocols.includes("gemini")) return "google-generative-ai"
  return null // images-only, skip
}

/** Parse raw API model into pi provider model */
function parseApiModel(raw: OpenModelApiModel): OpenModelProviderModel | null {
  const api = protocolToApi(raw.supported_protocols)
  if (!api) return null // skip image-only models

  const pricing = KNOWN_PRICING[raw.id] ?? { input: 0, output: 0 }
  const id = raw.id

  return {
    id,
    name: `${id} (OpenModel)`,
    reasoning: guessReasoning(id, raw.owned_by),
    input: supportsImages(id, raw.owned_by) ? ["text", "image"] as const : ["text"] as const,
    cost: {
      input: pricing.input,
      output: pricing.output,
      cacheRead: pricing.input * 0.1,
      cacheWrite: pricing.input * 0.25,
    },
    contextWindow: guessContextWindow(id),
    maxTokens: guessMaxTokens(id),
    api,
  }
}

/** Fetch models from OpenModel API */
export async function fetchOpenModelModels(options?: {
  url?: string
  fetchImpl?: typeof fetch
  apiKey?: string
}): Promise<readonly OpenModelProviderModel[]> {
  const url = options?.url ?? DEFAULT_MODELS_URL
  const fetchImpl = options?.fetchImpl ?? fetch

  const headers: Record<string, string> = { accept: "application/json" }
  if (options?.apiKey) {
    headers["authorization"] = `Bearer ${options.apiKey}`
  }

  const response = await fetchImpl(url, { headers })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenModel models: ${response.status} ${response.statusText}`,
    )
  }

  const body = (await response.json()) as OpenModelModelsResponse
  const models: OpenModelProviderModel[] = []

  for (const raw of body.data) {
    if (raw.object !== "model") continue
    const parsed = parseApiModel(raw)
    if (parsed) models.push(parsed)
  }

  return models
}

// Allow direct execution: `tsx src/models.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.env.OPENMODEL_API_KEY
  const models = await fetchOpenModelModels({
    apiKey: key ?? undefined,
  })
  for (const m of models) {
    console.log(`${m.id}  [${m.api}]  ${m.input.join("+")}  ctx=${m.contextWindow}  $${m.cost.input}/${m.cost.output}`)
  }
}
