import type { JobApplication, JobSource } from "@/lib/types"
import { isFieldEmpty } from "./validation"

/**
 * Calculates response rate statistics
 * @param applications - Array of job applications
 * @returns Object with response statistics
 */
export const calculateResponseStats = (applications: JobApplication[]) => {
    const totalApplied = applications.length
    const responded = applications.filter(
        (a) =>
            a.status === "screening" ||
            a.status === "interview" ||
            a.status === "offer" ||
            a.respondedAt
    ).length

    const interviews = applications.filter(
        (a) => a.status === "interview" || a.status === "offer" || a.interviewDate
    ).length

    const offers = applications.filter((a) => a.status === "offer").length

    const responseRate = totalApplied > 0 ? Math.round((responded / totalApplied) * 100) : 0
    const interviewRate = responded > 0 ? Math.round((interviews / responded) * 100) : 0

    return {
        totalApplied,
        responded,
        interviews,
        offers,
        responseRate,
        interviewRate,
    }
}

/**
 * Calculates statistics by job source
 * @param applications - Array of job applications
 * @returns Map of source to count
 */
export const calculateSourceStats = (
    applications: JobApplication[]
): Map<string, number> => {
    const sourceStats = new Map<string, number>()
    applications.forEach((app) => {
        const source = app.source || "other"
        sourceStats.set(source, (sourceStats.get(source) || 0) + 1)
    })
    return sourceStats
}

/**
 * Calculates missing fields statistics
 * @param applications - Array of job applications
 * @returns Object with counts of missing fields
 */
export const calculateMissingFieldsStats = (applications: JobApplication[]) => {
    return {
        description: applications.filter((a) => isFieldEmpty(a.description)).length,
        requirements: applications.filter((a) => isFieldEmpty(a.requirements)).length,
        responsibilities: applications.filter((a) => isFieldEmpty(a.responsibilities)).length,
        techStack: applications.filter((a) => isFieldEmpty(a.techStack)).length,
    }
}

/**
 * Calculates total incomplete applications
 * @param applications - Array of job applications
 * @returns Count of incomplete applications
 */
export const calculateIncompleteApps = (applications: JobApplication[]): number => {
    return applications.filter(
        (a) =>
            isFieldEmpty(a.description) ||
            isFieldEmpty(a.requirements) ||
            isFieldEmpty(a.responsibilities) ||
            isFieldEmpty(a.techStack)
    ).length
}
