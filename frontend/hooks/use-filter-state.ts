import type { ApplicationStatus, JobSource } from "@/lib/types"
import { usePersistentState } from "./use-persistent-state"

export function useFilterState() {
    const [selectedTechs, setSelectedTechs] = usePersistentState<string[]>("selectedTechs", [])
    const [statusFilter, setStatusFilter] = usePersistentState<ApplicationStatus | "all">("statusFilter", "all")
    const [sourceFilter, setSourceFilter] = usePersistentState<JobSource | "all">("sourceFilter", "all")
    const [profileFilter, setProfileFilter] = usePersistentState<string>("profileFilter", "all")
    const [selectedLocations, setSelectedLocations] = usePersistentState<string[]>("selectedLocations", [])
    const [searchQuery, setSearchQuery] = usePersistentState<string>("searchQuery", "")
    const [missingFieldFilter, setMissingFieldFilter] = usePersistentState<string>("missingFieldFilter", "all")
    const [showFavoritesOnly, setShowFavoritesOnly] = usePersistentState<boolean>("showFavoritesOnly", false)

    return {
        selectedTechs,
        setSelectedTechs,
        statusFilter,
        setStatusFilter,
        sourceFilter,
        setSourceFilter,
        profileFilter,
        setProfileFilter,
        selectedLocations,
        setSelectedLocations,
        searchQuery,
        setSearchQuery,
        missingFieldFilter,
        setMissingFieldFilter,
        showFavoritesOnly,
        setShowFavoritesOnly,
    }
}
