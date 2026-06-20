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

import { fetchOpenModelModels } from "./src/models.js";
import {
  fetchModelStabilitySummary,
  fetchModelStabilityDetail,
  formatHealthStatus,
  formatConfidence,
  type HealthStatus,
} from "./src/stability.js";
import { login, refreshToken, getApiKey } from "./src/auth.js";

export default async function (pi: ExtensionAPI) {
  const apiKey = "$OPENMODEL_API_KEY";

  // Fetch models and stability data in parallel
  const [models, stabilityMap] = await Promise.all([
    fetchOpenModelModels(),
    fetchModelStabilitySummary().catch(
      () => [] as Array<{ model_name: string; health_status: HealthStatus }>,
    ),
  ]);

  // Build stability lookup for model name enrichment
  const stabilityByModel = new Map(
    stabilityMap.map((s) => [s.model_name, s.health_status]),
  );

  // Group models by API type with health status in names
  const messagesModels: ProviderModelConfig[] = [];
  const responsesModels: ProviderModelConfig[] = [];
  const geminiModels: ProviderModelConfig[] = [];

  for (const m of models) {
    const health = stabilityByModel.get(m.id);
    const healthPrefix = health
      ? `${formatHealthStatus(health).split(" ")[0]} `
      : "";

    const config: ProviderModelConfig = {
      id: m.id,
      name: `${healthPrefix}${m.id}`,
      reasoning: m.reasoning,
      input: m.input as any,
      cost: m.cost,
      contextWindow: m.contextWindow,
      maxTokens: m.maxTokens,
    };

    if (m.api === "anthropic-messages") {
      messagesModels.push(config);
    } else if (m.api === "openai-responses") {
      responsesModels.push(config);
    } else if (m.api === "google-generative-ai") {
      geminiModels.push(config);
    }
  }

  // Register Messages protocol provider (Anthropic/DeepSeek/DashScope/Kimi/MiniMax/Zai)
  if (messagesModels.length > 0) {
    pi.registerProvider("openmodel", {
      name: "OpenModel (Messages)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "anthropic-messages",
      oauth: {
        name: "OpenModel",
        login,
        refreshToken,
        getApiKey,
      },
      models: messagesModels,
    });
  }

  // Register Responses protocol provider (OpenAI models)
  if (responsesModels.length > 0) {
    pi.registerProvider("openmodel-responses", {
      name: "OpenModel (Responses)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "openai-responses",
      oauth: {
        name: "OpenModel",
        login,
        refreshToken,
        getApiKey,
      },
      models: responsesModels,
    });
  }

  // Register Gemini protocol provider (Google models)
  if (geminiModels.length > 0) {
    pi.registerProvider("openmodel-gemini", {
      name: "OpenModel (Gemini)",
      baseUrl: "https://api.openmodel.ai",
      apiKey,
      api: "google-generative-ai",
      oauth: {
        name: "OpenModel",
        login,
        refreshToken,
        getApiKey,
      },
      models: geminiModels,
    });
  }

  // -----------------------------------------------------------------------
  // /openmodel - Status and quick info
  // -----------------------------------------------------------------------
  pi.registerCommand("openmodel", {
    description: "Show OpenModel provider status and quick actions",
    handler: async (_args: string, ctx: any) => {
      const totalModels = models.length;
      const messagesCount = messagesModels.length;
      const responsesCount = responsesModels.length;
      const geminiCount = geminiModels.length;

      const lines = [
        "╔══════════════════════════════════════╗",
        "║        OpenModel.ai Provider         ║",
        "╠══════════════════════════════════════╣",
        `║  Models:     ${String(totalModels).padStart(3)} total              ║`,
        `║  Messages:   ${String(messagesCount).padStart(3)} (Anthropic fmt)   ║`,
        `║  Responses:  ${String(responsesCount).padStart(3)} (OpenAI fmt)     ║`,
        `║  Gemini:     ${String(geminiCount).padStart(3)} (Google fmt)       ║`,
        "╠══════════════════════════════════════╣",
        "║  Commands:                          ║",
        "║  /login openmodel  - Set API key    ║",
        "║  /openmodel-stability - View health ║",
        "╚══════════════════════════════════════╝",
      ];

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });

  // -----------------------------------------------------------------------
  // /openmodel-stability - Model health dashboard
  // -----------------------------------------------------------------------
  pi.registerCommand("openmodel-stability", {
    description: "Show OpenModel model stability metrics",
    handler: async (args: string | undefined, ctx: any) => {
      if (args?.trim()) {
        // Show detail for a specific model
        const modelName = args.trim();
        try {
          const detail = await fetchModelStabilityDetail(modelName);
          const lines = [
            `📊 ${detail.model_name}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `Health:     ${formatHealthStatus(detail.health_status)}`,
            `Success:    ${detail.summary.success_rate.toFixed(2)}%`,
            `Latency:    ${detail.summary.avg_latency_ms.toFixed(0)}ms avg`,
            `TTFT:       ${detail.summary.avg_ttft_ms.toFixed(0)}ms avg`,
            `Throughput: ${detail.summary.avg_tps.toFixed(1)} tok/s`,
            `Confidence: ${formatConfidence(detail.confidence)}`,
            `Updated:    ${new Date(detail.updated_at * 1000).toLocaleString()}`,
            ``,
            `📈 Hourly data (last 24h):`,
          ];
          for (const point of detail.series) {
            const time = new Date(point.ts * 1000).toLocaleTimeString();
            lines.push(
              `  ${time.padStart(8)}  ` +
                `${point.success_rate.toFixed(1).padStart(5)}%  ` +
                `${String(point.avg_latency_ms.toFixed(0)).padStart(5)}ms  ` +
                `${point.avg_tps.toFixed(1).padStart(6)} t/s  ` +
                `${point.confidence}`,
            );
          }
          ctx.ui.notify(lines.join("\n"), "info");
        } catch {
          ctx.ui.notify(
            `❌ Could not fetch stability for "${modelName}". Check the model name.`,
            "error",
          );
        }
      } else {
        // Show summary for all models
        try {
          const summary = await fetchModelStabilitySummary();
          if (summary.length === 0) {
            ctx.ui.notify("No stability data available.", "warning");
            return;
          }
          const lines = [
            "📊 OpenModel Stability (24h)",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          ];
          // Sort: operational first, then by success rate
          const statusOrder: Record<string, number> = {
            operational: 0,
            healthy: 1,
            degraded: 2,
            unstable: 3,
            no_data: 4,
          };
          const sorted = [...summary].sort((a, b) => {
            const ao = statusOrder[a.health_status] ?? 5;
            const bo = statusOrder[b.health_status] ?? 5;
            if (ao !== bo) return ao - bo;
            return b.success_rate - a.success_rate;
          });

          for (const s of sorted) {
            const healthEmoji = formatHealthStatus(s.health_status).split(
              " ",
            )[0];
            const paddedName = s.model_name.padEnd(28).slice(0, 28);
            lines.push(
              `  ${healthEmoji} ${paddedName} ` +
                `${s.success_rate.toFixed(1).padStart(5)}%  ` +
                `${s.avg_latency_ms.toFixed(0).padStart(5)}ms  ` +
                `${s.avg_tps.toFixed(1).padStart(6)} t/s`,
            );
          }
          ctx.ui.notify(lines.join("\n"), "info");
        } catch {
          ctx.ui.notify("❌ Failed to fetch stability summary.", "error");
        }
      }
    },
  });
}
