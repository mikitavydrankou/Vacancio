import { JobApplication, Resume, ResumeProfile, ApplicationStatus } from "./types"

const API_Base = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

export async function fetchProfiles(): Promise<ResumeProfile[]> {
    const res = await fetch(`${API_Base}/profiles`)
    if (!res.ok) throw new Error("Failed to fetch profiles")
    const data = await res.json()
    return data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.created_at)
    }))
}

export async function createProfile(name: string): Promise<ResumeProfile> {
    const res = await fetch(`${API_Base}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
    })
    if (!res.ok) throw new Error("Failed to create profile")
    const data = await res.json()
    return { ...data, createdAt: new Date(data.created_at) }
}

export async function deleteProfile(id: string): Promise<void> {
    const res = await fetch(`${API_Base}/profiles/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete profile")
}

export async function fetchResumes(profileId?: string): Promise<Resume[]> {
    const url = profileId ? `${API_Base}/resumes?profile_id=${profileId}` : `${API_Base}/resumes`
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch resumes")
    const data = await res.json()
    return data.map((r: any) => ({
        ...r,
        profileId: r.profile_id, // Map snake_case to camelCase
        uploadedAt: new Date(r.uploaded_at),
        filePath: r.file_path,
        fileName: r.name + ".pdf", // Backend stores name without ext usually, or we adjust
        fileData: "" // We don't fetch file data by default anymore
    }))
}

export async function uploadResume(profileId: string, file: File): Promise<Resume> {
    const formData = new FormData()
    formData.append("profile_id", profileId)
    formData.append("file", file)

    const res = await fetch(`${API_Base}/resumes`, {
        method: "POST",
        body: formData
    })
    if (!res.ok) {
        const errorText = await res.text()
        console.error("Upload error:", res.status, errorText)
        throw new Error(`Failed to upload resume: ${res.status} - ${errorText}`)
    }
    const data = await res.json()
    return {
        ...data,
        profileId: data.profile_id,
        uploadedAt: new Date(data.uploaded_at),
        fileName: file.name
    }
}

export async function fetchApplications(profileId?: string, resumeVersion?: number): Promise<JobApplication[]> {
    let url = `${API_Base}/applications?`
    if (profileId) url += `profile_id=${profileId}&`
    if (resumeVersion) url += `resume_version=${resumeVersion}&`

    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch applications")
    const data = await res.json()
    return data.map((a: any) => ({
        ...a,
        profileId: a.profile_id,
        resumeId: a.resume_id,
        resumeVersion: a.resume_version,
        appliedAt: new Date(a.applied_at),
        respondedAt: a.responded_at ? new Date(a.responded_at) : undefined,
        interviewDate: a.interview_date ? new Date(a.interview_date) : undefined,
        rejectedAt: a.rejected_at ? new Date(a.rejected_at) : undefined,
        techStack: a.tech_stack || [],
        niceToHaveStack: a.nice_to_have_stack || [],
        responsibilities: a.responsibilities || [],
        requirements: a.requirements || [],
        workMode: a.work_mode,
        employmentType: a.employment_type,
        rawData: a.raw_data,
        isFavorite: !!a.is_favorite,
        isArchived: !!a.is_archived
    }))
}

export async function fetchApplication(id: string): Promise<JobApplication> {
    const res = await fetch(`${API_Base}/applications/${id}`)
    if (!res.ok) throw new Error("Failed to fetch application")
    const data = await res.json()
    return {
        ...data,
        profileId: data.profile_id,
        resumeId: data.resume_id,
        resumeVersion: data.resume_version,
        appliedAt: new Date(data.applied_at),
        respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
        interviewDate: data.interview_date ? new Date(data.interview_date) : undefined,
        rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
        techStack: data.tech_stack || [],
        niceToHaveStack: data.nice_to_have_stack || [],
        responsibilities: data.responsibilities || [],
        requirements: data.requirements || [],
        workMode: data.work_mode,
        employmentType: data.employment_type,
        rawData: data.raw_data,
        isFavorite: !!data.is_favorite,
        isArchived: !!data.is_archived
    }
}

export async function createApplication(app: Partial<JobApplication>): Promise<JobApplication> {
    // Map camelCase to snake_case for API
    const payload = {
        url: app.url,
        company: app.company,
        position: app.position,
        location: app.location,
        salary: app.salary,
        source: app.source,
        tech_stack: app.techStack,
        nice_to_have_stack: app.niceToHaveStack,
        responsibilities: app.responsibilities,
        requirements: app.requirements,
        work_mode: app.workMode,
        employment_type: app.employmentType,
        description: app.description,
        raw_data: app.rawData,
        status: app.status,
        profile_id: app.profileId,
        resume_id: app.resumeId,
        resume_version: app.resumeVersion
    }

    const res = await fetch(`${API_Base}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error("Failed to create application")
    const data = await res.json()
    return {
        ...data,
        profileId: data.profile_id,
        resumeId: data.resume_id,
        resumeVersion: data.resume_version,
        appliedAt: new Date(data.applied_at),
        techStack: data.tech_stack || [],
        niceToHaveStack: data.nice_to_have_stack || [],
        responsibilities: data.responsibilities || [],
        requirements: data.requirements || [],
        workMode: data.work_mode,
        employmentType: data.employment_type
    }
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void> {
    const payload: any = { status }
    if (status === "responded") payload.responded_at = new Date().toISOString()
    if (status === "rejected") payload.rejected_at = new Date().toISOString()

    const res = await fetch(`${API_Base}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error("Failed to update application")
}

export async function updateApplication(id: string, updates: Partial<JobApplication>): Promise<JobApplication> {
    // Map camelCase to snake_case for API
    const payload: any = {}
    if (updates.position !== undefined) payload.position = updates.position
    if (updates.company !== undefined) payload.company = updates.company
    if (updates.location !== undefined) payload.location = updates.location
    if (updates.salary !== undefined) payload.salary = updates.salary
    if (updates.url !== undefined) payload.url = updates.url
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.techStack !== undefined) payload.tech_stack = updates.techStack
    if (updates.niceToHaveStack !== undefined) payload.nice_to_have_stack = updates.niceToHaveStack
    if (updates.requirements !== undefined) payload.requirements = updates.requirements
    if (updates.responsibilities !== undefined) payload.responsibilities = updates.responsibilities
    if (updates.workMode !== undefined) payload.work_mode = updates.workMode
    if (updates.employmentType !== undefined) payload.employment_type = updates.employmentType
    if (updates.status !== undefined) payload.status = updates.status

    const res = await fetch(`${API_Base}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Failed to update application: ${errorText}`)
    }
    const data = await res.json()
    return {
        ...data,
        profileId: data.profile_id,
        resumeId: data.resume_id,
        resumeVersion: data.resume_version,
        appliedAt: new Date(data.applied_at),
        respondedAt: data.responded_at ? new Date(data.responded_at) : undefined,
        interviewDate: data.interview_date ? new Date(data.interview_date) : undefined,
        rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
        techStack: data.tech_stack || [],
        niceToHaveStack: data.nice_to_have_stack || [],
        responsibilities: data.responsibilities || [],
        requirements: data.requirements || [],
        workMode: data.work_mode,
        employmentType: data.employment_type,
        rawData: data.raw_data,
        isFavorite: !!data.is_favorite,
        isArchived: !!data.is_archived
    }
}

export async function deleteApplication(id: string): Promise<void> {
    const res = await fetch(`${API_Base}/applications/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to delete application")
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const res = await fetch(`${API_Base}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: isFavorite })
    })
    if (!res.ok) throw new Error("Failed to toggle favorite")
}

export async function toggleArchive(id: string, isArchived: boolean): Promise<void> {
    const res = await fetch(`${API_Base}/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: isArchived })
    })
    if (!res.ok) throw new Error("Failed to toggle archive")
}
