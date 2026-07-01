/**
 * Shared error handling for OpenModel API responses.
 *
 * OpenModel Web API returns errors in this format:
 *   { success: false, error: { code: string, msg: string, detail?: string } }
 *
 * Proxy endpoints return errors in provider-specific formats (Anthropic, OpenAI, Gemini).
 */

/** Check if a value is a non-null object (Record) */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

/** Parse an OpenModel Web API error response body */
export function parseWebError(body: unknown): { code: string; message: string; detail?: string } {
  if (isRecord(body) && isRecord(body.error)) {
    const err = body.error
    if (typeof err.code === "string" && typeof err.msg === "string") {
      const result: { code: string; message: string; detail?: string } = {
        code: err.code,
        message: err.msg,
      }
      if (typeof err.detail === "string") {
        result.detail = err.detail
      }
      return result
    }
  }
  return { code: "UNKNOWN", message: "An unknown error occurred" }
}

/** Parse an OpenModel proxy API error body (any format) */
export function parseProxyError(body: unknown): { code: string; message: string } {
  if (isRecord(body) && isRecord(body.error)) {
    const err = body.error

    // Anthropic format: { type: "error", error: { type, message } }
    if (body.type === "error" && typeof err.message === "string") {
      return { code: typeof err.type === "string" ? err.type : "UNKNOWN", message: err.message }
    }

    // OpenAI format: { error: { message, type, code } }
    if (typeof err.message === "string") {
      const code = typeof err.code === "string" ? err.code : typeof err.type === "string" ? err.type : "UNKNOWN"
      return { code, message: err.message }
    }

    // Gemini format: { error: { code, message, status } }
    if (typeof err.status === "string") {
      return { code: err.status, message: typeof err.message === "string" ? err.message : "Unknown error" }
    }
  }

  return { code: "UNKNOWN", message: "An unknown error occurred" }
}

/** Return a user-friendly message for known error codes */
export function friendlyMessage(code: string, fallback: string): string {
  const map: Record<string, string> = {
    UNAUTHORIZED: "🔑 Invalid API key. Check your credentials or run /login again.",
    INVALID_TOKEN: "🔑 Invalid or expired API key. Run /login again.",
    TOKEN_EXPIRED: "🔑 API key expired. Run /login again.",
    FORBIDDEN: "🚫 Permission denied. Check your account permissions.",
    NOT_FOUND: "🔍 Resource not found. Check the model name or endpoint.",
    RESOURCE_NOT_FOUND: "🔍 Model not found. Check the name and try again.",
    TOO_MANY_REQUESTS: "⏳ Rate limited. Try again later.",
    INSUFFICIENT_BALANCE: "💳 Insufficient balance. Top up at console.openmodel.ai",
    PAYLOAD_TOO_LARGE: "📦 Request too large. Reduce the input size.",
    VALIDATION_FAILED: "⚠️ Invalid request. Check your parameters.",
    INTERNAL_ERROR: "🔧 OpenModel API error. Try again later.",
    SERVICE_UNAVAIL: "🔧 Service temporarily unavailable. Try again later.",
    BAD_REQUEST: "⚠️ Invalid request. Check the parameters.",
    CONFIG_NOT_READY: "⏳ System not ready. Try again later.",
  }
  return map[code] ?? fallback
}
