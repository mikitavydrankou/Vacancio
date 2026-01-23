import type { JobApplication } from "@/lib/types"

/**
 * Checks if a field value is empty
 * @param value - The value to check
 * @returns true if the value is null, undefined, empty string, or empty array
 */
export const isFieldEmpty = (value: unknown): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === "string") return value.trim() === ""
    if (Array.isArray(value)) return value.length === 0
    return false
}

/**
 * Checks if a job application has all required fields filled
 * @param app - The job application to check
 * @returns true if all required fields are filled
 */
export const isAppComplete = (app: JobApplication): boolean => {
    return (
        !isFieldEmpty(app.description) &&
        !isFieldEmpty(app.requirements) &&
        !isFieldEmpty(app.responsibilities) &&
        !isFieldEmpty(app.techStack)
    )
}
