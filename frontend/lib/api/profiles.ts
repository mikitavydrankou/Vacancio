import type { ResumeProfile } from "@/lib/types"
import { mapProfileFromApi } from "./mappers"
import { API_BASE } from "./base"

/**
 * Fetches all profiles
 */
export async function fetchProfiles(): Promise<ResumeProfile[]> {
    const res = await fetch(`${API_BASE}/profiles`)
    if (!res.ok) throw new Error("Failed to fetch profiles")
    const data = await res.json()
    return data.map(mapProfileFromApi)
}

/**
 * Creates a new profile
 */
export async function createProfile(name: string): Promise<ResumeProfile> {
    const res = await fetch(`${API_BASE}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error("Failed to create profile")
    const data = await res.json()
    return mapProfileFromApi(data)
}

/**
 * Renames a profile
 */
export async function updateProfile(id: string, name: string): Promise<ResumeProfile> {
    const res = await fetch(`${API_BASE}/profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) {
        const detail = await res.text().catch(() => "")
        throw new Error(detail || "Failed to rename profile")
    }
    return mapProfileFromApi(await res.json())
}

/**
 * Deletes a profile
 */
export async function deleteProfile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/profiles/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete profile")
}
