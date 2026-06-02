"use client"

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
import { useHomePageState } from "@/hooks/use-home-page-state"
import { getPreFilteredApps, applyTechFilter, calculateTechStats, calculateLocationStats } from "@/lib/utils/filters"

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

  // UI state (extracted to custom hook)
  const {
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
  } = useHomePageState({ profiles, resumes, isLoading })

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
        isLoading={isLoading}
      />

      <main className="max-w-[1400px] mx-auto px-6 py-6 space-y-8">
        {/* Top Section - Add Job Form */}
        <AddJobForm
          resumes={resumes}
          activeProfileId={activeProfileId}
          activeResumeVersion={activeResumeVersion}
          onSubmit={handleCreateApplication}
        />

        {/* Analytics Dashboard */}
        <div className="p-5 bg-card rounded-xl border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Overview</h3>
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
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">
              Applications <span className="text-muted-foreground font-normal">· {filteredApps.length}</span>
            </h3>
          </div>

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
