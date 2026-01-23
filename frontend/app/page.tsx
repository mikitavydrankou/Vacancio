"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ApplicationHeader } from "@/components/application-header"
import { AddJobForm } from "@/components/add-job-form"
import { ApplicationFilters } from "@/components/application-filters"
import { FlatView } from "@/components/flat-view"
import { GroupedView } from "@/components/grouped-view"
import { useApplicationData } from "@/hooks/use-application-data"
import { useFilterState } from "@/hooks/use-filter-state"
import { usePersistentState } from "@/hooks/use-persistent-state"
import { getPreFilteredApps, applyTechFilter, calculateTechStats, calculateLocationStats, isFieldEmpty } from "@/lib/utils/filters"
import { loadFromStorage } from "@/lib/utils/storage"

export default function HomePage() {
  const router = useRouter()

  // Data hooks
  const {
    profiles,
    resumes,
    applications,
    isLoading,
    setProfiles,
    loadAllData,
    refreshData,

    handleStatusChange,
    handleDelete,
    handleToggleFavorite,
    handleToggleArchive,
    handleCreateApplication,
    handleReparse,
  } = useApplicationData()


  // Filter state
  const {
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
  } = useFilterState()

  // UI state
  const [activeProfileId, setActiveProfileId] = usePersistentState<string>("activeProfileId", "")
  const [activeResumeVersion, setActiveResumeVersion] = usePersistentState<string>("activeResumeVersion", "")
  const [viewMode, setViewMode] = usePersistentState<"flat" | "grouped">("viewMode", "grouped")
  const [expandedProfiles, setExpandedProfiles] = usePersistentState<string[]>("expandedProfiles", [])
  const [expandedVersions, setExpandedVersions] = usePersistentState<string[]>("expandedVersions", [])

  // Initialize expanded state on data load
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
      setExpandedProfiles(profiles.map(p => p.id))
    }

    // Initial versions expansion: latest version for each profile
    const savedExpandedVersions = loadFromStorage<string[]>("expandedVersions", [])
    if (savedExpandedVersions.length === 0) {
      const initialVersions: string[] = []
      profiles.forEach(p => {
        const pResumes = resumes.filter(r => r.profileId === p.id)
        if (pResumes.length > 0) {
          const latest = pResumes.reduce((prev, curr) => (curr.version > prev.version ? curr : prev))
          initialVersions.push(`${p.id}-v${latest.version}`)
        }
      })
      setExpandedVersions(initialVersions)
    }
  }, [isLoading, profiles, resumes]) // Run when data loads

  // Filtering logic
  const preFilteredApps = getPreFilteredApps(applications, {
    profileFilter,
    statusFilter,
    sourceFilter,
    selectedLocations,
    showFavoritesOnly,
    searchQuery,
    missingFieldFilter,
  })

  const filteredApps = applyTechFilter(preFilteredApps, selectedTechs)
  const sortedTechs = calculateTechStats(preFilteredApps, filteredApps)
  const sortedLocations = calculateLocationStats(applications)

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ApplicationHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        profiles={profiles}
        resumes={resumes}
        activeProfileId={activeProfileId}
        activeResumeVersion={activeResumeVersion}
        onProfileChange={setActiveProfileId}
        onResumeVersionChange={setActiveResumeVersion}
      />

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">
        {/* Top Section - Add Job Form */}
        <div className="w-full">
          <AddJobForm
            resumes={resumes}
            activeProfileId={activeProfileId}
            activeResumeVersion={activeResumeVersion}
            onSubmit={handleCreateApplication}
            onRefresh={refreshData}
          />
        </div>

        {/* Analytics Dashboard */}
        <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
          <AnalyticsDashboard
            applications={applications}
            resumes={resumes}
            onFilterByMissing={(field) => {
              const currentField = missingFieldFilter.split(":")[1]
              if (currentField !== field) {
                setMissingFieldFilter(`missing:${field}`)
              } else if (missingFieldFilter.startsWith("missing:")) {
                setMissingFieldFilter(`filled:${field}`)
              } else {
                setMissingFieldFilter("all")
              }
            }}
          />
        </div>

        {/* Filters Section - Horizontal Layout */}
        <div className="space-y-4">
          <ApplicationFilters
            profiles={profiles}
            profileFilter={profileFilter}
            sourceFilter={sourceFilter}
            statusFilter={statusFilter}
            showFavoritesOnly={showFavoritesOnly}
            selectedTechs={selectedTechs}
            selectedLocations={selectedLocations}
            missingFieldFilter={missingFieldFilter}
            sortedTechs={sortedTechs}
            sortedLocations={sortedLocations}
            onProfileFilterChange={setProfileFilter}
            onSourceFilterChange={setSourceFilter}
            onStatusFilterChange={setStatusFilter}
            onShowFavoritesOnlyChange={setShowFavoritesOnly}
            onSelectedTechsChange={setSelectedTechs}
            onSelectedLocationsChange={setSelectedLocations}
            onMissingFieldFilterChange={setMissingFieldFilter}
          />
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Input
              placeholder="Search jobs (position, company, location, tech, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 bg-background"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : viewMode === "flat" ? (
            <FlatView
              applications={filteredApps}
              profiles={profiles}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onReparse={handleReparse}
              onApplicationClick={(id) => router.push(`/applications/${id}`)}

            />
          ) : (
            <GroupedView
              profiles={profiles}
              resumes={resumes}
              applications={filteredApps}
              expandedProfiles={new Set(expandedProfiles)}
              expandedVersions={new Set(expandedVersions)}
              profileFilter={profileFilter}
              statusFilter={statusFilter}
              sourceFilter={sourceFilter}
              selectedTechs={selectedTechs}
              onToggleProfile={toggleProfile}
              onToggleVersion={toggleVersion}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onReparse={handleReparse}
              onApplicationClick={(id) => router.push(`/applications/${id}`)}
            />

          )}
        </div>
      </main>
    </div>
  )
}
