import type { Resume } from "@/lib/types"
import { mapResumeFromApi } from "./mappers"
import { API_BASE } from "./base"

/**
 * Fetches all resumes or filtered by profile
 */
export async function fetchResumes(profileId?: string): Promise<Resume[]> {
    const url = profileId
        ? `${API_BASE}/resumes?profile_id=${profileId}`
        : `${API_BASE}/resumes`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch resumes")
    const data = await res.json()
    return data.map(mapResumeFromApi)
}

/**
 * Uploads a new resume
 */
export async function uploadResume(
    profileId: string,
    file: File
): Promise<Resume> {
    const formData = new FormData()
    formData.append("profile_id", profileId)
    formData.append("file", file)

    const res = await fetch(`${API_BASE}/resumes`, {
        method: "POST",
        body: formData,
    })
    if (!res.ok) {
        const errorText = await res.text()
        console.error("Upload error:", res.status, errorText)
        throw new Error(`Failed to upload resume: ${res.status} - ${errorText}`)
    }
    const data = await res.json()
    return {
        ...mapResumeFromApi(data),
        fileName: file.name,
    }
}

/**
 * Renames a resume version.
 */
export async function updateResume(id: string, name: string): Promise<Resume> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error("Failed to rename resume")
    return mapResumeFromApi(await res.json())
}

/**
 * Deletes a resume version. Applications tracked under it are removed too.
 */
export async function deleteResume(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/resumes/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete resume")
}
