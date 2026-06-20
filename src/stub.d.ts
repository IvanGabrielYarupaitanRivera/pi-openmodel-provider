/**
 * Stub type declarations for peer dependencies that may not be installed.
 * These are provided by pi-coding-agent when the extension runs.
 */

declare module "@earendil-works/pi-coding-agent" {
  export interface ExtensionAPI {
    registerProvider(name: string, config: any): void
    registerCommand(name: string, options: any): void
  }

  export interface ProviderModelConfig {
    id: string
    name: string
    reasoning: boolean
    input: readonly ["text" | "image"]
    cost: {
      input: number
      output: number
      cacheRead: number
      cacheWrite: number
    }
    contextWindow: number
    maxTokens: number
    api?: string
    headers?: Record<string, string>
  }
}