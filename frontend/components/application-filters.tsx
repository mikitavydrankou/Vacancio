import type { ApplicationStatus, JobSource, ResumeProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star, AlertCircle, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSourceLabel } from "@/lib/job-parser"
import { STATUS_CONFIG, STATUSES, SOURCES } from "@/lib/constants/application"

interface ApplicationFiltersProps {
    profiles: ResumeProfile[]
    profileFilter: string
    sourceFilter: JobSource | "all"
    statusFilter: ApplicationStatus | "all"
    showFavoritesOnly: boolean
    selectedTechs: string[]
    selectedLocations: string[]
    missingFieldFilter: string
    sortedTechs: [string, number][]
    sortedLocations: [string, number][]
    onProfileFilterChange: (value: string) => void
    onSourceFilterChange: (value: JobSource | "all") => void
    onStatusFilterChange: (value: ApplicationStatus | "all") => void
    onShowFavoritesOnlyChange: (value: boolean) => void
    onSelectedTechsChange: (value: string[]) => void
    onSelectedLocationsChange: (value: string[]) => void
    onMissingFieldFilterChange: (value: string) => void
}

export function ApplicationFilters({
    profiles,
    profileFilter,
    sourceFilter,
    statusFilter,
    showFavoritesOnly,
    selectedTechs,
    selectedLocations,
    missingFieldFilter,
    sortedTechs,
    sortedLocations,
    onProfileFilterChange,
    onSourceFilterChange,
    onStatusFilterChange,
    onShowFavoritesOnlyChange,
    onSelectedTechsChange,
    onSelectedLocationsChange,
    onMissingFieldFilterChange,
}: ApplicationFiltersProps) {
    return (
        <div className="space-y-3 p-4 bg-card rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-semibold">Filters</h3>

            <div className="flex gap-2">
                <Select value={profileFilter} onValueChange={onProfileFilterChange}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Profile" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Profiles</SelectItem>
                        {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sourceFilter} onValueChange={(v) => onSourceFilterChange(v as JobSource | "all")}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {SOURCES.map((s) => (
                            <SelectItem key={s} value={s}>{getSourceLabel(s)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as ApplicationStatus | "all")}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Favorites Toggle */}
                <button
                    onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
                    className={cn(
                        "flex items-center justify-center gap-1.5 text-xs px-3 h-8 rounded-md transition-colors border whitespace-nowrap",
                        showFavoritesOnly ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-background border-border hover:border-amber-500/50"
                    )}
                >
                    <Star className={cn("h-3 w-3", showFavoritesOnly && "fill-amber-400")} />
                    {showFavoritesOnly ? "Favorites" : "Favorites"}
                </button>
            </div>

            {/* Tech Stack Filters */}
            {sortedTechs.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Tech Stack</label>
                        {selectedTechs.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => onSelectedTechsChange([])} className="h-5 px-1 text-[10px]">
                                Clear
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {sortedTechs.slice(0, 20).map(([tech, count]) => (
                            <button
                                key={tech}
                                onClick={() =>
                                    onSelectedTechsChange(selectedTechs.includes(tech) ? selectedTechs.filter((t) => t !== tech) : [...selectedTechs, tech])
                                }
                                className={cn(
                                    "text-[10px] px-2 py-1 rounded-md transition-colors border",
                                    selectedTechs.includes(tech)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background border-border hover:border-primary/50"
                                )}
                            >
                                {tech} <span className="opacity-60 ml-0.5">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Location Filters */}
            {sortedLocations.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Location</label>
                        {selectedLocations.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => onSelectedLocationsChange([])} className="h-5 px-1 text-[10px]">
                                Clear
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {sortedLocations.slice(0, 10).map(([location, count]) => (
                            <button
                                key={location}
                                onClick={() =>
                                    onSelectedLocationsChange(selectedLocations.includes(location) ? selectedLocations.filter((l) => l !== location) : [...selectedLocations, location])
                                }
                                className={cn(
                                    "text-[10px] px-2 py-1 rounded-md transition-colors border",
                                    selectedLocations.includes(location)
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background border-border hover:border-primary/50"
                                )}
                            >
                                {location} <span className="opacity-60 ml-0.5">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {missingFieldFilter !== "all" && (
                <Badge variant="outline" className={cn(
                    "w-full justify-center gap-1",
                    missingFieldFilter.startsWith("missing:") ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-green-500/10 text-green-400 border-green-500/30"
                )}>
                    {missingFieldFilter.startsWith("missing:") ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    {missingFieldFilter.startsWith("missing:") ? "Missing" : "Filled"}: {missingFieldFilter.split(":")[1]}
                    <button onClick={() => onMissingFieldFilterChange("all")} className="ml-1 hover:text-foreground">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )}
        </div>
    )
}
