import type { ResumeProfile } from "@/lib/types"
import { mapProfileFromApi } from "./mappers"

const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined"
        ? `http://${window.location.hostname}:8000`
        : "http://localhost:8000")

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
 * Deletes a profile
 */
export async function deleteProfile(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/profiles/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete profile")
}
