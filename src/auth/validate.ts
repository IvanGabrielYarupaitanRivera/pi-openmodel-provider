/**
 * API key validation and sanitization.
 *
 * Sanitizes user-pasted input (handling terminal paste wrappers, control chars)
 * and validates that the key matches OpenModel's "om-..." format.
 */

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
