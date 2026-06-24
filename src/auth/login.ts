/**
 * OpenModel authentication for pi's /login flow.
 *
 * Flow:
 * 1. Opens the OpenModel Console in the browser
 * 2. Prompts the user to paste their API key
 * 3. Validates the key format (must start with "om-")
 * 4. Stores credentials in pi's auth.json
 *
 * Since OpenModel API keys don't expire, "refresh" is a no-op.
 */

import { sanitizeApiKey, isValidApiKey } from "./validate.ts"

export interface OAuthLoginCallbacks {
  onAuth(params: { url: string }): void;
  onPrompt(params: { message: string }): Promise<string>;
  onSelect?(params: {
    message: string;
    options: { id: string; label: string }[];
  }): Promise<string | undefined>;
}

export interface OAuthCredentials {
  refresh: string;
  access: string;
  expires: number;
}

export const CONSOLE_URL = "https://console.openmodel.ai"
const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000 // API keys don't expire

function credentialsFromApiKey(apiKey: string): OAuthCredentials {
  return {
    refresh: apiKey,
    access: apiKey,
    expires: Date.now() + FIVE_YEARS_MS,
  }
}

async function promptForKey(
  callbacks: OAuthLoginCallbacks,
  message: string,
): Promise<string> {
  return sanitizeApiKey(await callbacks.onPrompt({ message }))
}

async function handleKey(
  apiKey: string,
  callbacks: OAuthLoginCallbacks,
): Promise<OAuthCredentials> {
  if (!apiKey) {
    throw new Error("No OpenModel API key provided")
  }

  if (!isValidApiKey(apiKey)) {
    // Offer retry when onSelect is available
    if (callbacks.onSelect) {
      const retry = await callbacks.onSelect({
        message: `Invalid API key format. Key should start with "om-". Try again?`,
        options: [
          { id: "retry", label: "🔄 Try again" },
          { id: "cancel", label: "❌ Cancel" },
        ],
      })
      if (retry === "retry") {
        return login(callbacks)
      }
    }
    throw new Error("Login cancelled - invalid API key")
  }

  return credentialsFromApiKey(apiKey)
}

/**
 * /login openmodel handler.
 *
 * Offers two options:
 * 1. Browser: opens the OpenModel Console so the user can create/copy a key
 * 2. Manual: prompts the user to paste their API key
 */
export async function login(
  callbacks: OAuthLoginCallbacks,
): Promise<OAuthCredentials> {
  // Determine login method (onSelect is optional)
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
    callbacks.onAuth({ url: CONSOLE_URL })

    const apiKey = await promptForKey(
      callbacks,
      `1. Open ${CONSOLE_URL}\n2. In the sidebar, click on API Keys\n3. Click Create API Key, give it a name, and copy the generated key\n4. Paste the key here (starts with "om-"):`,
    )

    return handleKey(apiKey, callbacks)
  }

  // Manual paste
  const apiKey = await promptForKey(callbacks, 'Paste your OpenModel API key (starts with "om-"):')
  return handleKey(apiKey, callbacks)
}

/**
 * OpenModel API keys don't expire, so "refresh" is a no-op.
 */
export async function refreshToken(
  credentials: OAuthCredentials,
): Promise<OAuthCredentials> {
  return credentialsFromApiKey(credentials.refresh)
}

/**
 * Extract the API key from stored credentials.
 */
export function getApiKey(credentials: OAuthCredentials): string {
  return credentials.access
}
