import type { JobApplication, Resume, ResumeProfile } from "@/lib/types"

/**
 * Parses a date string or Date object into a Date
 * Returns current date if parsing fails
 */
const parseDate = (date: any): Date => {
    if (!date) return new Date()
    const d = new Date(date)
    return isNaN(d.getTime()) ? new Date() : d
}

/**
 * Maps application data from API (snake_case) to frontend format (camelCase)
 */
export const mapApplicationFromApi = (data: any): JobApplication => {
    return {
        ...data,
        profileId: data.profile_id,
        resumeId: data.resume_id,
        resumeVersion: data.resume_version,
        appliedAt: parseDate(data.applied_at),
        respondedAt: data.responded_at ? parseDate(data.responded_at) : undefined,
        interviewDate: data.interview_date ? parseDate(data.interview_date) : undefined,
        rejectedAt: data.rejected_at ? parseDate(data.rejected_at) : undefined,
        techStack: data.tech_stack || [],
        niceToHaveStack: data.nice_to_have_stack || [],
        responsibilities: data.responsibilities || [],
        requirements: data.requirements || [],
        workMode: data.work_mode,
        employmentType: data.employment_type,
        rawData: data.raw_data,
        isFavorite: !!data.is_favorite,
        isArchived: !!data.is_archived,
    }
}

/**
 * Maps application data from frontend format (camelCase) to API format (snake_case)
 */
export const mapApplicationToApi = (app: Partial<JobApplication>): any => {
    const payload: any = {}

    if (app.url !== undefined) payload.url = app.url
    if (app.company !== undefined) payload.company = app.company
    if (app.position !== undefined) payload.position = app.position
    if (app.location !== undefined) payload.location = app.location
    if (app.salary !== undefined) payload.salary = app.salary
    if (app.source !== undefined) payload.source = app.source
    if (app.techStack !== undefined) payload.tech_stack = app.techStack
    if (app.niceToHaveStack !== undefined) payload.nice_to_have_stack = app.niceToHaveStack
    if (app.responsibilities !== undefined) payload.responsibilities = app.responsibilities
    if (app.requirements !== undefined) payload.requirements = app.requirements
    if (app.workMode !== undefined) payload.work_mode = app.workMode
    if (app.employmentType !== undefined) payload.employment_type = app.employmentType
    if (app.description !== undefined) payload.description = app.description
    if (app.rawData !== undefined) payload.raw_data = app.rawData
    if (app.status !== undefined) payload.status = app.status
    if (app.profileId !== undefined) payload.profile_id = app.profileId
    if (app.resumeId !== undefined) payload.resume_id = app.resumeId
    if (app.resumeVersion !== undefined) payload.resume_version = app.resumeVersion

    return payload
}

/**
 * Maps resume data from API (snake_case) to frontend format (camelCase)
 */
export const mapResumeFromApi = (data: any): Resume => {
    return {
        ...data,
        profileId: data.profile_id,
        uploadedAt: parseDate(data.uploaded_at),
        filePath: data.file_path,
        fileName: data.name ? data.name + ".pdf" : data.file_name || "",
        fileData: "",
    }
}

/**
 * Maps profile data from API (snake_case) to frontend format (camelCase)
 */
export const mapProfileFromApi = (data: any): ResumeProfile => {
    return {
        ...data,
        createdAt: parseDate(data.created_at),
    }
}
