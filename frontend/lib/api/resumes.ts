import type { Resume } from "@/lib/types"
import { mapResumeFromApi } from "./mappers"

const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (typeof window !== "undefined"
        ? `http://${window.location.hostname}:8000`
        : "http://localhost:8000")

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
