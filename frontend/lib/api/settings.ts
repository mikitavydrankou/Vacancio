import { API_BASE } from "./base"

export type KeySource = "db" | "env" | "none"

export interface OpenRouterStatus {
    configured: boolean
    source: KeySource
    masked: string | null
}

export interface KeyTestResult {
    valid: boolean
    detail?: string
}

/**
 * Returns whether an OpenRouter key is configured and where it comes from.
 * The raw key is never returned by the backend.
 */
export async function getOpenRouterStatus(): Promise<OpenRouterStatus> {
    const res = await fetch(`${API_BASE}/settings/openrouter`)
    if (!res.ok) throw new Error("Failed to load OpenRouter settings")
    return res.json()
}

/**
 * Saves the OpenRouter key (overrides the environment variable).
 * Pass an empty string to clear it and fall back to the env var.
 */
export async function setOpenRouterKey(apiKey: string): Promise<OpenRouterStatus> {
    const res = await fetch(`${API_BASE}/settings/openrouter`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
    })
    if (!res.ok) throw new Error("Failed to save OpenRouter key")
    return res.json()
}

/**
 * Validates a key against OpenRouter. If `apiKey` is empty, the stored/env key is tested.
 */
export async function testOpenRouterKey(apiKey: string): Promise<KeyTestResult> {
    const res = await fetch(`${API_BASE}/settings/openrouter/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey }),
    })
    if (!res.ok) {
        const detail = await res.text().catch(() => "")
        throw new Error(detail || "Failed to reach OpenRouter")
    }
    return res.json()
}
