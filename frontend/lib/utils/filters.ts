import type { JobApplication, ApplicationStatus, JobSource } from "@/lib/types"

export interface FilterOptions {
    profileFilter: string
    statusFilter: ApplicationStatus | "all"
    sourceFilter: JobSource | "all"
    selectedLocations: string[]
    showFavoritesOnly: boolean
    searchQuery: string
    missingFieldFilter: string
    selectedTechs: string[]
}

export const isFieldEmpty = (value: unknown): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === "string") return value.trim() === ""
    if (Array.isArray(value)) return value.length === 0
    return false
}

export const getPreFilteredApps = (
    apps: JobApplication[],
    filters: Omit<FilterOptions, "selectedTechs">
) => {
    const {
        profileFilter,
        statusFilter,
        sourceFilter,
        selectedLocations,
        showFavoritesOnly,
        searchQuery,
        missingFieldFilter,
    } = filters

    return apps
        .filter((app) => !app.isArchived)
        .filter((app) => profileFilter === "all" || app.profileId === profileFilter)
        .filter((app) => statusFilter === "all" || app.status === statusFilter)
        .filter((app) => sourceFilter === "all" || app.source === sourceFilter)
        .filter((app) => selectedLocations.length === 0 || selectedLocations.some((loc) => app.location?.toLowerCase().includes(loc.toLowerCase())))
        .filter((app) => !showFavoritesOnly || app.isFavorite)
        .filter((app) => {
            if (!searchQuery.trim()) return true
            const query = searchQuery.toLowerCase()
            return (
                app.position?.toLowerCase().includes(query) ||
                app.company?.toLowerCase().includes(query) ||
                app.location?.toLowerCase().includes(query) ||
                app.description?.toLowerCase().includes(query) ||
                app.salary?.toLowerCase().includes(query) ||
                (app.techStack || []).some(tech => tech.toLowerCase().includes(query)) ||
                (app.niceToHaveStack || []).some(tech => tech.toLowerCase().includes(query)) ||
                (app.requirements || []).some(req => req.toLowerCase().includes(query)) ||
                (app.responsibilities || []).some(resp => resp.toLowerCase().includes(query)) ||
                app.rawData?.toLowerCase().includes(query)
            )
        })
        .filter((app) => {
            if (missingFieldFilter === "all") return true
            const [mode, field] = missingFieldFilter.split(":")
            const isMissing = mode === "missing"
            switch (field) {
                case "description": return isMissing ? isFieldEmpty(app.description) : !isFieldEmpty(app.description)
                case "requirements": return isMissing ? isFieldEmpty(app.requirements) : !isFieldEmpty(app.requirements)
                case "responsibilities": return isMissing ? isFieldEmpty(app.responsibilities) : !isFieldEmpty(app.responsibilities)
                case "techStack": return isMissing ? isFieldEmpty(app.techStack) : !isFieldEmpty(app.techStack)
                default: return true
            }
        })
}

export const applyTechFilter = (apps: JobApplication[], selectedTechs: string[]) => {
    return apps
        .filter((app) => {
            if (selectedTechs.length === 0) return true
            return selectedTechs.every((t) => app.techStack.includes(t) || app.niceToHaveStack?.includes(t))
        })
        .sort((a, b) => {
            const timeA = a.appliedAt ? new Date(a.appliedAt).getTime() : 0
            const timeB = b.appliedAt ? new Date(b.appliedAt).getTime() : 0
            return timeB - timeA
        })
}

export const calculateTechStats = (
    preFilteredApps: JobApplication[],
    filteredApps: JobApplication[]
): [string, number][] => {
    // 1. Get universe of techs from pre-filtered apps (to show 0s)
    const allTechs = new Set<string>()
    preFilteredApps.forEach((app) => {
        app.techStack.forEach((tech) => allTechs.add(tech))
        app.niceToHaveStack?.forEach((tech) => allTechs.add(tech))
    })

    // 2. Get counts from currently filtered apps
    const currentCounts = new Map<string, number>()
    filteredApps.forEach((app) => {
        app.techStack.forEach((tech) => {
            currentCounts.set(tech, (currentCounts.get(tech) || 0) + 1)
        })
        app.niceToHaveStack?.forEach((tech) => {
            currentCounts.set(tech, (currentCounts.get(tech) || 0) + 1)
        })
    })

    // 3. Combine
    return Array.from(allTechs).map(tech => {
        return [tech, currentCounts.get(tech) || 0] as [string, number]
    }).sort((a, b) => b[1] - a[1])
}

export const calculateLocationStats = (applications: JobApplication[]): [string, number][] => {
    const locationStats = new Map<string, number>()
    applications.forEach((app) => {
        if (app.location) {
            locationStats.set(app.location, (locationStats.get(app.location) || 0) + 1)
        }
    })
    return Array.from(locationStats.entries()).sort((a, b) => b[1] - a[1])
}
