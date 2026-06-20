/**
 * OpenModel authentication for pi's /login flow.
 *
 * Provides OAuth integration so users can authenticate via:
 *   /login openmodel
 *
 * Flow:
 * 1. Opens the OpenModel Console in the browser
 * 2. Prompts the user to paste their API key
 * 3. Validates the key format (must start with "om-")
 * 4. Stores credentials in pi's auth.json
 *
 * Since OpenModel API keys don't expire, "refresh" is a no-op.
 */

export interface OAuthLoginCallbacks {
  onAuth(params: { url: string }): void
  onPrompt(params: { message: string }): Promise<string>
  onSelect?(params: {
    message: string
    options: { id: string; label: string }[]
  }): Promise<string | undefined>
}

export interface OAuthCredentials {
  refresh: string
  access: string
  expires: number
}

const CONSOLE_URL = "https://console.openmodel.ai"
const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000 // API keys don't expire

/**
 * Sanitize API key input, removing terminal paste wrappers and control chars.
 */
export function sanitizeApiKey(input: string): string {
  const esc = String.fromCharCode(27)
  return Array.from(
    input
      .replaceAll(`${esc}[200~`, "")
      .replaceAll(`${esc}[201~`, "")
      .replaceAll("[200~", "")
      .replaceAll("[201~", ""),
  )
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join("")
    .trim()
}

/**
 * Validate that an API key looks like a valid OpenModel key.
 */
export function isValidApiKey(key: string): boolean {
  return /^om-[A-Za-z0-9_-]+$/.test(key)
}

function credentialsFromApiKey(apiKey: string): OAuthCredentials {
  return {
    refresh: apiKey,
    access: apiKey,
    expires: Date.now() + FIVE_YEARS_MS,
  }
}

/**
 * /login openmodel handler.
 *
 * Offers two options:
 * 1. Browser: opens the OpenModel Console so the user can create/copy a key
 * 2. Manual: prompts the user to paste their API key
 */
export async function login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
  // Offer login method choice (onSelect is optional)
  let method: string | undefined
  if (callbacks.onSelect) {
    method = await callbacks.onSelect({
      message: "How would you like to authenticate with OpenModel?",
      options: [
        { id: "browser", label: "🌐 Open console in browser" },
        { id: "paste", label: "📋 Paste API key manually" },
      ],
    })
  }

  if (!method) {
    throw new Error("Login cancelled")
  }

  if (method === "browser") {
    // Open the OpenModel Console in the browser
    callbacks.onAuth({ url: CONSOLE_URL })

    // Then prompt for the API key
    const apiKey = sanitizeApiKey(
      await callbacks.onPrompt({
        message: `1. Go to ${CONSOLE_URL}\n2. Create an API key (Settings > API Keys)\n3. Paste the key here (starts with "om-"):`,
      }),
    )

    if (!apiKey) {
      throw new Error("No OpenModel API key provided")
    }

    if (!isValidApiKey(apiKey)) {
      let retry: string | undefined
      if (callbacks.onSelect) {
        retry = await callbacks.onSelect({
          message: `Invalid API key format. Key should start with "om-". Try again?`,
          options: [
            { id: "retry", label: "🔄 Try again" },
            { id: "cancel", label: "❌ Cancel" },
          ],
        })
      }

      if (retry !== "retry") {
        throw new Error("Login cancelled - invalid API key")
      }

      // Recursive retry
      return login(callbacks)
    }

    return credentialsFromApiKey(apiKey)
  }

  // Manual paste
  const apiKey = sanitizeApiKey(
    await callbacks.onPrompt({
      message: "Paste your OpenModel API key (starts with \"om-\"):",
    }),
  )

  if (!apiKey) {
    throw new Error("No OpenModel API key provided")
  }

  if (!isValidApiKey(apiKey)) {
    const retry = callbacks.onSelect
      ? await callbacks.onSelect({
          message: `Invalid API key format. Key should start with "om-". Try again?`,
          options: [
            { id: "retry", label: "🔄 Try again" },
            { id: "cancel", label: "❌ Cancel" },
          ],
        })
      : undefined

    if (retry !== "retry") {
      throw new Error("Login cancelled - invalid API key")
    }

    return login(callbacks)
  }

  return credentialsFromApiKey(apiKey)
}

/**
 * OpenModel API keys don't expire, so "refresh" is a no-op.
 */
export async function refreshToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  return credentialsFromApiKey(credentials.refresh)
}

/**
 * Extract the API key from stored credentials.
 */
export function getApiKey(credentials: OAuthCredentials): string {
  return credentials.access
}
