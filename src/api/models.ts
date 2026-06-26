/**
 * OpenModel.ai model fetching and parsing.
 *
 * Fetches available models from OpenModel's public API (no auth required).
 * Pricing, context window, and capabilities are all provided by the API.
 *
 * This module owns the orchestration — ping both endpoints, merge results,
 * and return canonical model objects. Provider-specific logic (compat,
 * protocols, pricing) is delegated to src/providers/*.
 */

import { parseWebError, parseProxyError, friendlyMessage } from "../errors.ts"
import { pricePerMillion } from "../providers/pricing.ts"
import { determineApi, inferApiFromProvider, thinkingLevelMapForApi } from "../providers/protocols.ts"
import { compatForProvider } from "../providers/compat.ts"
import type { ApiProtocol } from "../providers/protocols.ts"

const DEFAULT_WEB_MODELS_URL = "https://api.openmodel.ai/web/v1/models"
export const DEFAULT_LEGACY_MODELS_URL = "https://api.openmodel.ai/v1/models"

// ──────────────────────────────────────────────
// Public model interface
// ──────────────────────────────────────────────

export interface OpenModelProviderModel {
  id: string
  name: string
  reasoning: boolean
  thinkingLevelMap?: Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh", string | null>>
  input: readonly ("text" | "image")[]
  cost: { input: number; output: number; cacheRead: number; cacheWrite: number }
  contextWindow: number
  maxTokens: number
  api: ApiProtocol
  compat?: Record<string, unknown>
}

// ──────────────────────────────────────────────
// Internal API response types
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Fetch: Web API (public, pageable)
// ──────────────────────────────────────────────

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
      let body: any
      try { body = await response.json() } catch {}
      const err = parseWebError(body)
      throw new Error(
        `Failed to fetch models: ${response.status} ${err.code} — ${friendlyMessage(err.code, err.message)}`,
      )
    }

    const body = (await response.json()) as WebApiResponse
    if (!body.success) {
      throw new Error(
        `Failed to fetch models — ${friendlyMessage("INTERNAL_ERROR", "Unknown error")}`,
      )
    }

    totalPages = body.meta.pagination.totalPages
    for (const model of body.data) {
      modelMap.set(model.key, model)
    }
    page++
  }

  return modelMap
}

// ──────────────────────────────────────────────
// Fetch: Legacy API (requires API key)
// ──────────────────────────────────────────────

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
    let body: any
    try { body = await response.json() } catch {}
    const err = parseProxyError(body)
    throw new Error(
      `Failed to fetch models: ${response.status} — ${friendlyMessage(err.code, err.message)}`,
    )
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

// ──────────────────────────────────────────────
// Orchestration
// ──────────────────────────────────────────────

/** Safely extract a numeric price from the prices record */
function getNumberPrice(
  prices: Record<string, number | Record<string, number>>,
  key: string,
): number | undefined {
  const val = prices[key]
  return typeof val === "number" ? val : undefined
}

/**
 * Fetch all models from OpenModel API (public, no auth required for web endpoint).
 *
 * Combines pricing/capabilities from the web API with protocol info from
 * the legacy endpoint. If the legacy endpoint fails (e.g., no API key),
 * protocols are inferred from the provider name.
 */
export async function fetchOpenModelModels(options?: {
  webUrl?: string
  legacyUrl?: string
  fetchImpl?: typeof fetch
}): Promise<readonly OpenModelProviderModel[]> {
  const fetchImpl = options?.fetchImpl ?? fetch

  const [webModels, legacyModels] = await Promise.all([
    fetchWebModels({ fetchImpl }),
    fetchLegacyModels({ fetchImpl }).catch(() => new Map()),
  ])

  const models: OpenModelProviderModel[] = []

  for (const [id, web] of webModels) {
    // Skip image-only models (e.g., DALL-E)
    if (
      web.supports.supports_image_generation &&
      !web.supports.supports_vision &&
      !web.supports.supports_reasoning
    ) {
      continue
    }

    // Determine API protocol
    const legacy = legacyModels.get(id)
    const protocols = legacy?.supported_protocols ?? []
    let api = determineApi(protocols, web.provider_key)
    if (!api) {
      api = inferApiFromProvider(web.provider_key)
    }

    // Parse pricing (safely — some price fields may be Record<string, number>)
    const inputPrice = pricePerMillion(getNumberPrice(web.prices, "input_cost_per_token"))
    const outputPrice = pricePerMillion(getNumberPrice(web.prices, "output_cost_per_token"))
    const cacheRead = pricePerMillion(getNumberPrice(web.prices, "cache_read_input_token_cost"))
    const cacheWrite = pricePerMillion(getNumberPrice(web.prices, "cache_creation_input_token_cost"))

    // Build model config
    const reasoning = web.supports.supports_reasoning ?? false
    const compat = compatForProvider(web.provider_key, reasoning)

    const model: OpenModelProviderModel = {
      id,
      name: id,
      reasoning,
      input: web.supports.supports_vision ? (["text", "image"] as const) : (["text"] as const),
      cost: {
        input: inputPrice * (web.price_multiplier ?? 1),
        output: outputPrice * (web.price_multiplier ?? 1),
        cacheRead,
        cacheWrite,
      },
      contextWindow: web.max.max_input_tokens ?? 128_000,
      maxTokens: web.max.max_output_tokens ?? web.max.max_tokens ?? 16_384,
      api,
      ...(reasoning ? { thinkingLevelMap: thinkingLevelMapForApi(api) } : {}),
      ...(compat ? { compat } : {}),
    }

    models.push(model)
  }

  return models
}
