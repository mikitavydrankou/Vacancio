import type { JobApplication, ApplicationStatus } from "@/lib/types"
import { mapApplicationFromApi, mapApplicationToApi } from "./mappers"

const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined"
        ? `http://${window.location.hostname}:8000`
        : "http://localhost:8000")

/**
 * Fetches all applications or filtered by profile/resume version
 */
export async function fetchApplications(
    profileId?: string,
    resumeVersion?: number
): Promise<JobApplication[]> {
    let url = `${API_BASE}/applications?`
    if (profileId) url += `profile_id=${profileId}&`
    if (resumeVersion) url += `resume_version=${resumeVersion}&`

    const res = await fetch(url)
    if (!res.ok) {
        const errorBody = await res.text().catch(() => "No error body")
        console.error(
            `Failed to fetch applications: ${res.status} ${res.statusText}`,
            errorBody
        )
        throw new Error("Failed to fetch applications")
    }

    const data = await res.json()
    return data.map(mapApplicationFromApi)
}

/**
 * Fetches a single application by ID
 */
export async function fetchApplication(id: string): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications/${id}`)
    if (!res.ok) throw new Error("Failed to fetch application")
    const data = await res.json()
    return mapApplicationFromApi(data)
}

/**
 * Creates a new application
 */
export async function createApplication(
    app: Partial<JobApplication>
): Promise<JobApplication> {
    const payload = mapApplicationToApi(app)

    const res = await fetch(`${API_BASE}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Failed to create application")
    const data = await res.json()
    return mapApplicationFromApi(data)
}

/**
 * Updates application status
 */
export async function updateApplicationStatus(
    id: string,
    status: ApplicationStatus
): Promise<void> {
    const payload: any = { status }
    if ((status as string) === "responded")
        payload.responded_at = new Date().toISOString()
    if (status === "rejected") payload.rejected_at = new Date().toISOString()

    const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Failed to update application")
}

/**
 * Updates application fields
 */
export async function updateApplication(
    id: string,
    updates: Partial<JobApplication>
): Promise<JobApplication> {
    const payload = mapApplicationToApi(updates)

    const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to update application: ${errorText}`)
    }
    const data = await res.json()
    return mapApplicationFromApi(data)
}

/**
 * Deletes an application
 */
export async function deleteApplication(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete application")
}

/**
 * Toggles favorite status
 */
export async function toggleFavorite(
    id: string,
    isFavorite: boolean
): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: isFavorite }),
    })
    if (!res.ok) throw new Error("Failed to toggle favorite")
}

/**
 * Toggles archive status
 */
export async function toggleArchive(id: string, isArchived: boolean): Promise<void> {
    const res = await fetch(`${API_BASE}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: isArchived }),
    })
    if (!res.ok) throw new Error("Failed to toggle archive")
}

/**
 * Triggers re-parsing of an application
 */
export async function reparseApplication(id: string): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/applications/${id}/reparse`, {
        method: "POST",
    })
    if (!res.ok) throw new Error("Failed to trigger re-parsing")
    const data = await res.json()
    return mapApplicationFromApi(data)
}
