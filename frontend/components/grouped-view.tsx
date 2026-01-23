import type { JobApplication, ApplicationStatus, Resume, ResumeProfile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight, FileText } from "lucide-react"
import { ApplicationRow } from "./application-row"

interface GroupedViewProps {
    profiles: ResumeProfile[]
    resumes: Resume[]
    applications: JobApplication[]
    expandedProfiles: Set<string>
    expandedVersions: Set<string>
    profileFilter: string
    statusFilter: string
    sourceFilter: string
    selectedTechs: string[]
    onToggleProfile: (id: string) => void
    onToggleVersion: (key: string) => void
    onStatusChange: (app: JobApplication, status: ApplicationStatus) => void
    onDelete: (id: string) => void
    onToggleFavorite: (app: JobApplication) => void
    onToggleArchive: (app: JobApplication) => void
    onReparse: (id: string) => void
    onApplicationClick: (id: string) => void
}


function getVersionsForProfile(profileId: string, resumes: Resume[]) {
    const pResumes = resumes.filter(r => r.profileId === profileId).map(r => r.version)
    return [...new Set(pResumes)].sort((a, b) => b - a)
}

export function GroupedView({
    profiles,
    resumes,
    applications,
    expandedProfiles,
    expandedVersions,
    profileFilter,
    statusFilter,
    sourceFilter,
    selectedTechs,
    onToggleProfile,
    onToggleVersion,
    onStatusChange,
    onDelete,
    onToggleFavorite,
    onToggleArchive,
    onReparse,
    onApplicationClick,
}: GroupedViewProps) {

    return (
        <div className="space-y-4">
            {profiles.map(profile => {
                const profileApps = applications.filter(a => a.profileId === profile.id)
                if (profileApps.length === 0 && (profileFilter !== "all" || statusFilter !== "all" || sourceFilter !== "all" || selectedTechs.length > 0)) return null

                const isExpanded = expandedProfiles.has(profile.id)

                return (
                    <div key={profile.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                        {/* Profile Header */}
                        <div
                            className="flex items-center gap-2 p-3 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors"
                            onClick={() => onToggleProfile(profile.id)}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-semibold">{profile.name}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">{profileApps.length} apps</Badge>
                        </div>

                        {isExpanded && (
                            <div className="p-4 space-y-4">
                                {/* Iterate Versions */}
                                {getVersionsForProfile(profile.id, resumes).map(version => {
                                    const versionApps = profileApps.filter(a => a.resumeVersion === version)
                                    if (versionApps.length === 0) return null

                                    const versionKey = `${profile.id}-v${version}`
                                    const isVersionExpanded = expandedVersions.has(versionKey)

                                    return (
                                        <div key={versionKey} className="ml-2 border-l-2 border-border pl-4">
                                            <div
                                                className="flex items-center gap-2 py-2 cursor-pointer text-sm text-foreground/80 hover:text-foreground"
                                                onClick={() => onToggleVersion(versionKey)}
                                            >
                                                {isVersionExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                <FileText className="h-3.5 w-3.5" />
                                                <span className="font-medium">Version {version}</span>
                                                <span className="text-muted-foreground text-xs">({versionApps.length})</span>
                                            </div>

                                            {isVersionExpanded && (
                                                <div className="mt-2 space-y-2">
                                                    {versionApps.map(app => (
                                                        <ApplicationRow
                                                            key={app.id}
                                                            app={app}
                                                            profiles={profiles}
                                                            onStatusChange={onStatusChange}
                                                            onDelete={onDelete}
                                                            onToggleFavorite={onToggleFavorite}
                                                            onToggleArchive={onToggleArchive}
                                                            onReparse={onReparse}
                                                            onClick={() => onApplicationClick(app.id)}

                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {profileApps.length === 0 && <div className="text-sm text-muted-foreground italic pl-6">No applications in this profile matching filters.</div>}
                            </div>
                        )}
                    </div>
                )
            })}

            {profiles.length === 0 && (
                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border">
                    Create a profile to get started
                </div>
            )}
        </div>
    )
}
