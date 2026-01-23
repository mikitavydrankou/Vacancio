import type { JobApplication, ApplicationStatus, ResumeProfile } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Trash2, Star, Archive, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUS_CONFIG, STATUSES } from "@/lib/constants/application"
import { formatDate, ensureAbsoluteUrl } from "@/lib/utils/formatting"

interface ApplicationRowProps {
    app: JobApplication
    profiles: ResumeProfile[]
    onStatusChange: (a: JobApplication, s: ApplicationStatus) => void
    onDelete: (id: string) => void
    onToggleFavorite: (a: JobApplication) => void
    onToggleArchive: (a: JobApplication) => void
    onReparse: (id: string) => void
    onClick: () => void
}

export function ApplicationRow({
    app,
    profiles,
    onStatusChange,
    onDelete,
    onToggleFavorite,
    onToggleArchive,
    onReparse,
    onClick,
}: ApplicationRowProps) {



    const handleReparse = async (e: React.MouseEvent) => {
        e.stopPropagation()
        onReparse(app.id)
    }


    return (
        <div
            className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer bg-card",
                "border-transparent hover:border-border hover:bg-secondary/50",
                app.status === 'parsing' && "border-amber-500/20 bg-amber-500/5",
                app.status === 'failed' && "border-red-500/30 bg-red-500/5 hover:border-red-500/50"
            )}

            onClick={(e) => {
                if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='combobox']") || (e.target as HTMLElement).closest("a")) return
                onClick()
            }}
        >
            {/* Favorite */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleFavorite(app)
                }}
                className="p-1 hover:bg-amber-500/10 rounded transition-colors"
            >
                <Star className={cn("h-4 w-4", app.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400")} />
            </button>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {app.url ? (
                        <a
                            href={ensureAbsoluteUrl(app.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm truncate hover:underline text-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >

                            {app.position}
                        </a>
                    ) : (
                        <span className="font-medium text-sm truncate">{app.position}</span>
                    )}
                    <span className="text-muted-foreground text-sm truncate">at {app.company}</span>
                    {app.status === 'failed' && (
                        <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1.5 animate-pulse">
                            Reparse required
                        </Badge>
                    )}
                    {app.status === 'parsing' && (
                        <Badge variant="outline" className="ml-2 text-[10px] h-4 px-1.5 border-amber-500/50 text-amber-600 bg-amber-500/10 animate-pulse">
                            Parsing...
                        </Badge>
                    )}
                </div>


                <div className="flex items-center gap-1 mt-0.5">
                    {(app.techStack || []).slice(0, 4).map((tech) => (
                        <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{tech}</span>
                    ))}
                </div>
            </div>

            {/* Metadata Badges */}
            <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 font-normal text-muted-foreground">
                    {profiles.find(p => p.id === app.profileId)?.name} v{app.resumeVersion}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{formatDate(app.appliedAt)}</span>
            </div>

            {/* Actions */}
            {app.url ? (
                <a
                    href={ensureAbsoluteUrl(app.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-secondary rounded"
                >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </a>
            ) : (
                <div className="p-1.5 opacity-50 cursor-not-allowed">
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onToggleArchive(app)
                }}
                title="Archive"
                className="p-1.5 hover:bg-amber-500/10 rounded"
            >
                <Archive className="h-3.5 w-3.5 text-muted-foreground hover:text-amber-400" />
            </button>
            {app.rawData && (
                <button
                    onClick={handleReparse}
                    title="Re-parse"
                    className="p-1.5 hover:bg-blue-500/10 rounded"
                >
                    <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground hover:text-blue-500", app.status === 'parsing' && "animate-spin")} />
                </button>
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(app.id)
                }}
                className="p-1.5 hover:bg-red-500/10 rounded"
            >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
            </button>
            <Select value={app.status} onValueChange={(v) => onStatusChange(app, v as ApplicationStatus)}>
                <SelectTrigger className={cn("h-7 text-xs w-28 border-0 shadow-none", STATUS_CONFIG[app.status]?.color || STATUS_CONFIG.no_response.color)}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                            <span className="text-xs">{STATUS_CONFIG[s].label}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
