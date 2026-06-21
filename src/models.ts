/**
 * OpenModel.ai model fetching and parsing.
 *
 * Fetches available models from OpenModel's public API (no auth required).
 * Pricing, context window, and capabilities are all provided by the API.
 */

export const DEFAULT_WEB_MODELS_URL = "https://api.openmodel.ai/web/v1/models"
export const DEFAULT_LEGACY_MODELS_URL = "https://api.openmodel.ai/v1/models"

export interface OpenModelProviderModel {
  id: string
  name: string
  reasoning: boolean
  thinkingLevelMap?: Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh", string | null>>
  input: readonly ("text" | "image")[]
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number }
  contextWindow: number
  maxTokens: number
  api: "anthropic-messages" | "openai-responses" | "google-generative-ai"
}

interface WebApiModel {
  key: string
  provider_key: string
  provider_name: string
  prices: Record<string, number | Record<string, number>>
  max: {
    max_input_tokens?: number
    max_output_tokens?: number
    max_tokens?: number
  }
  supports: {
    supports_reasoning?: boolean
    supports_vision?: boolean
    supports_image_generation?: boolean
  }
  price_multiplier: number
}

interface WebApiResponse {
  success: boolean
  data: WebApiModel[]
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } }
}

interface LegacyApiModel {
  id: string
  object: string
  owned_by: string
  supported_protocols: string[]
}

interface LegacyApiResponse {
  data: LegacyApiModel[]
  object: string
}

function pricePerMillion(costPerToken: number | undefined): number {
  if (costPerToken === undefined || costPerToken === null) return 0
  return Math.round(costPerToken * 1_000_000 * 1000) / 1000
}

function determineApi(protocols: string[], provider: string): "anthropic-messages" | "openai-responses" | "google-generative-ai" | null {
  if (protocols.includes("messages")) return "anthropic-messages"
  if (protocols.includes("responses")) return "openai-responses"
  if (protocols.includes("gemini")) return "google-generative-ai"
  return null
}

function thinkingLevelMapForApi(api: "anthropic-messages" | "openai-responses" | "google-generative-ai"): Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh", string | null>> {
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

/** Fetch all models from the web API (public, no auth required) */
async function fetchWebModels(options?: {
  url?: string
  fetchImpl?: typeof fetch
}): Promise<Map<string, WebApiModel>> {
  const baseUrl = options?.url ?? DEFAULT_WEB_MODELS_URL
  const fetchImpl = options?.fetchImpl ?? fetch

  const modelMap = new Map<string, WebApiModel>()
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await fetchImpl(`${baseUrl}?page=${page}`, {
      headers: { accept: "application/json" },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const body = (await response.json()) as WebApiResponse
    if (!body.success) throw new Error("Failed to fetch models")

    totalPages = body.meta.pagination.totalPages
    for (const model of body.data) {
      modelMap.set(model.key, model)
    }
    page++
  }

  return modelMap
}

/** Fetch protocol info from legacy models endpoint */
async function fetchLegacyModels(options?: {
  url?: string
  fetchImpl?: typeof fetch
}): Promise<Map<string, LegacyApiModel>> {
  const url = options?.url ?? DEFAULT_LEGACY_MODELS_URL
  const fetchImpl = options?.fetchImpl ?? fetch

  const response = await fetchImpl(url, {
    headers: { accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`)
  }

  const body = (await response.json()) as LegacyApiResponse
  const modelMap = new Map<string, LegacyApiModel>()

  for (const model of body.data) {
    if (model.object === "model") {
      modelMap.set(model.id, model)
    }
  }

  return modelMap
}

/** Fetch models from OpenModel API (public, no auth required) */
export async function fetchOpenModelModels(options?: {
  webUrl?: string
  legacyUrl?: string
  fetchImpl?: typeof fetch
}): Promise<readonly OpenModelProviderModel[]> {
  const fetchImpl = options?.fetchImpl ?? fetch

  const [webModels, legacyModels] = await Promise.all([
    fetchWebModels({ fetchImpl }),
    fetchLegacyModels({ fetchImpl }),
  ])

  const models: OpenModelProviderModel[] = []

  for (const [id, web] of webModels) {
    // Skip image-only models
    if (web.supports.supports_image_generation && !web.supports.supports_vision && !web.supports.supports_reasoning) {
      continue
    }

    const legacy = legacyModels.get(id)
    const protocols = legacy?.supported_protocols ?? []
    const api = determineApi(protocols, web.provider_key)
    if (!api) continue

    const inputPrice = pricePerMillion(web.prices.input_cost_per_token as number)
    const outputPrice = pricePerMillion(web.prices.output_cost_per_token as number)
    const cacheRead = pricePerMillion(web.prices.cache_read_input_token_cost as number)
    const cacheWrite = pricePerMillion(web.prices.cache_creation_input_token_cost as number)

    const reasoning = web.supports.supports_reasoning ?? false

    const base = {
      id,
      name: id,
      reasoning,
      input: web.supports.supports_vision ? ["text", "image"] as const : ["text"] as const,
      cost: {
        input: inputPrice * (web.price_multiplier ?? 1),
        output: outputPrice * (web.price_multiplier ?? 1),
        cacheRead,
        cacheWrite,
      },
      contextWindow: web.max.max_input_tokens ?? 128_000,
      maxTokens: web.max.max_output_tokens ?? web.max.max_tokens ?? 16_384,
      api,
    } as const

    const model = {
      ...base,
      ...(reasoning ? { thinkingLevelMap: thinkingLevelMapForApi(api) } : {}),
    } as unknown as OpenModelProviderModel

    models.push(model)
  }

  return models
}
