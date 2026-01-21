import type { JobApplication, ApplicationStatus, ResumeProfile } from "@/lib/types"
import { ApplicationRow } from "./application-row"

interface FlatViewProps {
    applications: JobApplication[]
    profiles: ResumeProfile[]
    onStatusChange: (app: JobApplication, status: ApplicationStatus) => void
    onDelete: (id: string) => void
    onToggleFavorite: (app: JobApplication) => void
    onToggleArchive: (app: JobApplication) => void
    onApplicationClick: (id: string) => void
}

export function FlatView({
    applications,
    profiles,
    onStatusChange,
    onDelete,
    onToggleFavorite,
    onToggleArchive,
    onApplicationClick,
}: FlatViewProps) {
    return (
        <div className="space-y-2">
            {applications.map(app => (
                <ApplicationRow
                    key={app.id}
                    app={app}
                    profiles={profiles}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                    onToggleArchive={onToggleArchive}
                    onClick={() => onApplicationClick(app.id)}
                />
            ))}
            {applications.length === 0 && (
                <div className="text-center py-20 text-muted-foreground bg-card rounded-lg border border-border">
                    No applications found
                </div>
            )}
        </div>
    )
}
