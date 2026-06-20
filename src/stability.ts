/**
 * OpenModel.ai Model Stability API.
 *
 * Fetches real-time stability metrics (success rate, latency, throughput)
 * for all models. Publicly accessible without authentication.
 *
 * Reference:
 *   GET https://api.openmodel.ai/web/v1/model-stability/summary
 *   GET https://api.openmodel.ai/web/v1/model-stability/:modelKey
 */

export const STABILITY_SUMMARY_URL =
  "https://api.openmodel.ai/web/v1/model-stability/summary";

/** Health status derived from success rate */
export type HealthStatus =
  | "operational"
  | "healthy"
  | "degraded"
  | "unstable"
  | "no_data";

/** Confidence level based on sample size */
export type ConfidenceLevel = "high" | "medium" | "low";

/** Stability summary for a single model */
export interface ModelStability {
  model_name: string;
  success_rate: number;
  avg_latency_ms: number;
  avg_tps: number;
  confidence: ConfidenceLevel;
  health_status: HealthStatus;
}

/** Stability summary for a single model with time series */
export interface ModelStabilityDetail {
  model_name: string;
  confidence: ConfidenceLevel;
  summary: {
    success_rate: number;
    avg_latency_ms: number;
    avg_ttft_ms: number;
    avg_tps: number;
  };
  series: Array<{
    ts: number;
    success_rate: number;
    avg_latency_ms: number;
    avg_ttft_ms: number;
    avg_tps: number;
    confidence: ConfidenceLevel;
  }>;
  updated_at: number;
  health_status: HealthStatus;
}

/** Determine health status from success rate */
function determineHealth(
  successRate: number,
  confidence: ConfidenceLevel,
): HealthStatus {
  if (confidence === "low") return "no_data";
  if (successRate >= 99.9) return "operational";
  if (successRate >= 99) return "healthy";
  if (successRate >= 95) return "degraded";
  return "unstable";
}

/** Fetch stability summary for all models */
export async function fetchModelStabilitySummary(options?: {
  url?: string;
  fetchImpl?: typeof fetch;
  hours?: number;
}): Promise<ModelStability[]> {
  const url = options?.url ?? STABILITY_SUMMARY_URL;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const hours = options?.hours ?? 24;

  const params = new URLSearchParams({ hours: String(hours) });
  const response = await fetchImpl(`${url}?${params}`, {
    headers: { accept: "application/json" },
  });

  const body = (await response.json()) as {
    success: boolean;
    data: Array<{
      model_name: string;
      success_rate: number;
      avg_latency_ms: number;
      avg_tps: number;
      confidence: ConfidenceLevel;
    }>;
  };

  if (!body.success) throw new Error("Model stability summary request failed");

  return body.data.map((item) => ({
    ...item,
    health_status: determineHealth(item.success_rate, item.confidence),
  }));
}

/** Fetch stability detail for a specific model */
export async function fetchModelStabilityDetail(
  modelKey: string,
  options?: {
    fetchImpl?: typeof fetch;
    hours?: number;
  },
): Promise<ModelStabilityDetail> {
  const fetchImpl = options?.fetchImpl ?? fetch;
  const hours = options?.hours ?? 24;

  const params = new URLSearchParams({ hours: String(hours) });
  const response = await fetchImpl(
    `https://api.openmodel.ai/web/v1/model-stability/${encodeURIComponent(modelKey)}?${params}`,
    { headers: { accept: "application/json" } },
  );

  const body = (await response.json()) as {
    success: boolean;
    data: {
      model_name: string;
      confidence: ConfidenceLevel;
      summary: {
        success_rate: number;
        avg_latency_ms: number;
        avg_ttft_ms: number;
        avg_tps: number;
      };
      series: Array<{
        ts: number;
        success_rate: number;
        avg_latency_ms: number;
        avg_ttft_ms: number;
        avg_tps: number;
        confidence: ConfidenceLevel;
      }>;
      updated_at: number;
    };
  };

  if (!body.success)
    throw new Error(`Model stability detail request failed for ${modelKey}`);

  return {
    ...body.data,
    health_status: determineHealth(
      body.data.summary.success_rate,
      body.data.confidence,
    ),
  };
}

/** Format health status with emoji */
export function formatHealthStatus(status: HealthStatus): string {
  switch (status) {
    case "operational":
      return "✅ Operational";
    case "healthy":
      return "🟢 Healthy";
    case "degraded":
      return "🟡 Degraded";
    case "unstable":
      return "🔴 Unstable";
    case "no_data":
      return "⚪ No Data";
  }
}

/** Format confidence level */
export function formatConfidence(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "🟢 High";
    case "medium":
      return "🟡 Medium";
    case "low":
      return "⚪ Low";
  }
}
