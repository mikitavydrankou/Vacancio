import { useEffect } from "react"
import type { Resume, ResumeProfile } from "@/lib/types"
import { usePersistentState } from "./use-persistent-state"
import { loadFromStorage } from "@/lib/utils/storage"

interface UseHomePageStateProps {
    profiles: ResumeProfile[]
    resumes: Resume[]
    isLoading: boolean
}

export function useHomePageState({ profiles, resumes, isLoading }: UseHomePageStateProps) {
    // UI state
    const [activeProfileId, setActiveProfileId] = usePersistentState<string>("activeProfileId", "")
    const [activeResumeVersion, setActiveResumeVersion] = usePersistentState<string>(
        "activeResumeVersion",
        ""
    )
    const [viewMode, setViewMode] = usePersistentState<"flat" | "grouped">("viewMode", "grouped")
    const [expandedProfiles, setExpandedProfiles] = usePersistentState<string[]>(
        "expandedProfiles",
        []
    )
    const [expandedVersions, setExpandedVersions] = usePersistentState<string[]>(
        "expandedVersions",
        []
    )

    // Initialize expanded state on data load
    useEffect(() => {
        if (isLoading || profiles.length === 0) return

        // Default selection only if not already set
        const savedProfileId = loadFromStorage("activeProfileId", "")
        if (!savedProfileId) {
            setActiveProfileId(profiles[0].id)
        }

        // Expand all by default only if no saved state
        const savedExpandedProfiles = loadFromStorage<string[]>("expandedProfiles", [])
        if (savedExpandedProfiles.length === 0) {
            setExpandedProfiles(profiles.map((p) => p.id))
        }

        // Initial versions expansion: latest version for each profile
        const savedExpandedVersions = loadFromStorage<string[]>("expandedVersions", [])
        if (savedExpandedVersions.length === 0) {
            const initialVersions: string[] = []
            profiles.forEach((p) => {
                const pResumes = resumes.filter((r) => r.profileId === p.id)
                if (pResumes.length > 0) {
                    const latest = pResumes.reduce((prev, curr) =>
                        curr.version > prev.version ? curr : prev
                    )
                    initialVersions.push(`${p.id}-v${latest.version}`)
                }
            })
            setExpandedVersions(initialVersions)
        }
    }, [isLoading, profiles, resumes])

    // Grouping logic
    const toggleProfile = (id: string) => {
        const current = new Set(expandedProfiles)
        if (current.has(id)) current.delete(id)
        else current.add(id)
        setExpandedProfiles(Array.from(current))
    }

    const toggleVersion = (key: string) => {
        const current = new Set(expandedVersions)
        if (current.has(key)) current.delete(key)
        else current.add(key)
        setExpandedVersions(Array.from(current))
    }

    return {
        activeProfileId,
        setActiveProfileId,
        activeResumeVersion,
        setActiveResumeVersion,
        viewMode,
        setViewMode,
        expandedProfiles,
        expandedVersions,
        toggleProfile,
        toggleVersion,
    }
}
