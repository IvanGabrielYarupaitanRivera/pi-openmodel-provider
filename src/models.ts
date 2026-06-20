/**
 * OpenModel.ai model fetching and parsing.
 *
 * Fetches available models from OpenModel's API endpoint
 * and maps them to pi provider model definitions.
 *
 * Rather than hardcoding per-model metadata, we infer capabilities
 * from the provider (owned_by) and model name patterns. This way
 * new models added by OpenModel are automatically supported.
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
  supported_apis?: SupportedProtocol[]  // alt name from docs
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

// ---------------------------------------------------------------------------
// Provider-level defaults based on owned_by
// ---------------------------------------------------------------------------

interface ProviderDefaults {
  contextWindow: number
  maxTokens: number
  reasoning: boolean
  supportsImages: boolean
  costPerMInput: number   // $ per million input tokens
  costPerMOutput: number  // $ per million output tokens
}

const PROVIDER_DEFAULTS: Record<string, ProviderDefaults> = {
  anthropic: {
    contextWindow: 200_000,
    maxTokens: 8_192,
    reasoning: true,
    supportsImages: true,
    costPerMInput: 3,
    costPerMOutput: 15,
  },
  deepseek: {
    contextWindow: 1_000_000,
    maxTokens: 65_536,
    reasoning: true,
    supportsImages: false,
    costPerMInput: 0.14,
    costPerMOutput: 0.28,
  },
  openai: {
    contextWindow: 128_000,
    maxTokens: 16_384,
    reasoning: true,
    supportsImages: true,
    costPerMInput: 2.5,
    costPerMOutput: 10,
  },
  gemini: {
    contextWindow: 1_000_000,
    maxTokens: 8_192,
    reasoning: true,
    supportsImages: true,
    costPerMInput: 0.30,
    costPerMOutput: 1.20,
  },
  moonshot: {
    contextWindow: 128_000,
    maxTokens: 65_536,
    reasoning: true,
    supportsImages: true,
    costPerMInput: 0.60,
    costPerMOutput: 3,
  },
  zai: {
    contextWindow: 128_000,
    maxTokens: 16_384,
    reasoning: true,
    supportsImages: false,
    costPerMInput: 1,
    costPerMOutput: 3.20,
  },
  dashscope: {
    contextWindow: 131_072,
    maxTokens: 16_384,
    reasoning: true,
    supportsImages: true,
    costPerMInput: 0.50,
    costPerMOutput: 3,
  },
  minimax: {
    contextWindow: 128_000,
    maxTokens: 16_384,
    reasoning: true,
    supportsImages: false,
    costPerMInput: 0.27,
    costPerMOutput: 0.95,
  },
  mimo: {
    contextWindow: 128_000,
    maxTokens: 16_384,
    reasoning: true,
    supportsImages: false,
    costPerMInput: 0,
    costPerMOutput: 0,
  },
}

const DEFAULT_FALLBACK: ProviderDefaults = {
  contextWindow: 128_000,
  maxTokens: 16_384,
  reasoning: true,
  supportsImages: false,
  costPerMInput: 0,
  costPerMOutput: 0,
}

function getDefaults(ownedBy: string): ProviderDefaults {
  return PROVIDER_DEFAULTS[ownedBy.toLowerCase()] ?? DEFAULT_FALLBACK
}

// ---------------------------------------------------------------------------
// Model-specific overrides for well-known exceptions
// ---------------------------------------------------------------------------

/** Fine-tune contextWindow for specific model IDs that differ from their provider default */
const CONTEXT_OVERRIDES: Record<string, number> = {
  // Some older/smaller models have less context
}

/** Fine-tune maxTokens for specific model IDs */
const MAX_TOKENS_OVERRIDES: Record<string, number> = {
  // e.g., "some-small-model": 4096,
}

/** Fine-tune reasoning for specific model IDs */
const REASONING_OVERRIDES: Record<string, boolean> = {
  "gpt-5.4-mini": false,
  "gemini-3.1-flash-lite-preview": false,
  "gemini-3-flash-preview": false,
}

/** Known pricing exceptions (model-specific overrides to provider defaults) */
const PRICING_OVERRIDES: Record<string, { input: number; output: number }> = {
  "claude-opus-4-7":    { input: 15, output: 75 },
  "claude-opus-4-6":    { input: 15, output: 75 },
  "claude-opus-4-8":    { input: 15, output: 75 },
  "claude-sonnet-4-5":  { input: 3, output: 15 },
  "claude-sonnet-4-6":  { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },
  "deepseek-v4-pro":    { input: 0.435, output: 0.87 },
  "deepseek-v4-flash":  { input: 0.14, output: 0.28 },
  "gpt-5.5-pro":        { input: 10, output: 40 },
  "gpt-5.5":            { input: 5, output: 20 },
  "gpt-5.4-pro":        { input: 5, output: 20 },
  "gpt-5.4":            { input: 2.5, output: 10 },
  "gpt-5.4-mini":       { input: 0.40, output: 1.60 },
  "gpt-5.3-codex":      { input: 2, output: 8 },
  "gpt-5.2-pro":        { input: 5, output: 20 },
  "gpt-5.2":            { input: 2, output: 8 },
  "gemini-3.5-flash":   { input: 0.30, output: 1.20 },
  "gemini-3.1-pro-preview": { input: 1.50, output: 6.00 },
  "gemini-3-flash-preview": { input: 0.15, output: 0.60 },
  "kimi-k2.6":          { input: 0.95, output: 4 },
  "kimi-k2.5":          { input: 0.60, output: 3 },
  "kimi-k2.7-code":     { input: 0.95, output: 4 },
  "glm-5.2":            { input: 1.40, output: 5.60 },
  "glm-5.1":            { input: 1.40, output: 4.40 },
  "glm-5":              { input: 1, output: 3.20 },
  "glm-4.7":            { input: 0.50, output: 2 },
  "qwen3.7-max":        { input: 2, output: 6 },
  "qwen3.6-max-preview":{ input: 1.30, output: 7.80 },
  "qwen3.6-plus":       { input: 0.50, output: 3 },
  "qwen3.6-flash":      { input: 0.20, output: 1 },
  "qwen3.5-plus":       { input: 0.50, output: 3 },
  "qwen3-max":          { input: 2.50, output: 6 },
  "MiniMax-M3":         { input: 0.50, output: 2 },
  "MiniMax-M2.7":       { input: 0.30, output: 1.20 },
  "MiniMax-M2.5":       { input: 0.27, output: 0.95 },
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

/** Map OpenModel protocol to pi API type */
function protocolToApi(protocols: SupportedProtocol[]): "anthropic-messages" | "openai-responses" | "google-generative-ai" | null {
  if (protocols.includes("messages")) return "anthropic-messages"
  if (protocols.includes("responses")) return "openai-responses"
  if (protocols.includes("gemini")) return "google-generative-ai"
  return null // images-only, skip
}

/** Parse raw API model into pi provider model */
function parseApiModel(raw: OpenModelApiModel): OpenModelProviderModel | null {
  // Accept both supported_protocols (API) and supported_apis (doc) field names
  const protocols = raw.supported_protocols ?? raw.supported_apis ?? []
  const api = protocolToApi(protocols)
  if (!api) return null // skip image-only models

  const defaults = getDefaults(raw.owned_by)
  const pricing = PRICING_OVERRIDES[raw.id] ?? {
    input: defaults.costPerMInput,
    output: defaults.costPerMOutput,
  }

  return {
    id: raw.id,
    name: raw.id,
    reasoning: REASONING_OVERRIDES[raw.id] ?? defaults.reasoning,
    input: defaults.supportsImages ? ["text", "image"] as const : ["text"] as const,
    cost: {
      input: pricing.input,
      output: pricing.output,
      cacheRead: pricing.input * 0.1,
      cacheWrite: pricing.input * 0.25,
    },
    contextWindow: CONTEXT_OVERRIDES[raw.id] ?? defaults.contextWindow,
    maxTokens: MAX_TOKENS_OVERRIDES[raw.id] ?? defaults.maxTokens,
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
// if (import.meta.url === `file://${process.argv[1]}`) {
//   const { env } = await import('node:process');
//   const key = env.OPENMODEL_API_KEY
//   const models = await fetchOpenModelModels({
//     apiKey: key ?? undefined,
//   })
//   for (const m of models) {
//     console.log(
//       `${m.id.padEnd(30)} ` +
//       `${m.api.padEnd(22)} ` +
//       `${m.input.join("+").padEnd(8)} ` +
//       `ctx=${String(m.contextWindow).padStart(7)} ` +
//       `max=${String(m.maxTokens).padStart(5)} ` +
//       `\$${m.cost.input.toFixed(3)}/\$${m.cost.output.toFixed(3)}`,
//     )
//   }
// }
