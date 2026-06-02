import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Layers, Archive, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Resume, ResumeProfile } from "@/lib/types"
import { SettingsDialog } from "@/components/settings-dialog"
import { InfoDialog } from "@/components/info-dialog"
import { cn } from "@/lib/utils"

interface ApplicationHeaderProps {
    viewMode: "flat" | "grouped"
    onViewModeChange: (mode: "flat" | "grouped") => void
    profiles: ResumeProfile[]
    resumes: Resume[]
    activeProfileId: string
    activeResumeVersion: string
    onProfileChange: (id: string) => void
    onResumeVersionChange: (version: string) => void
    isLoading?: boolean
}

export function ApplicationHeader({
    viewMode,
    onViewModeChange,
    profiles,
    resumes,
    activeProfileId,
    activeResumeVersion,
    onProfileChange,
    onResumeVersionChange,
    isLoading = false
}: ApplicationHeaderProps) {
    const router = useRouter()

    // First run: finished loading and no profiles exist yet. Guide the user to create one.
    const isFirstRun = !isLoading && profiles.length === 0

    const activeProfileResumes = resumes
        .filter(r => r.profileId === activeProfileId)
        .sort((a, b) => b.version - a.version)

    return (
        <header className="border-b border-border bg-card sticky top-0 z-20">
            <div className="px-6 py-3">
                <div className="flex items-center justify-between gap-6">
                    {/* Left Section: Logo & Title */}
                    <div className="flex items-center gap-3 min-w-fit">
                        <h1 className="text-lg font-semibold flex items-center gap-2">
                            <Layers className="h-5 w-5" /> Vacancio
                        </h1>
                    </div>

                    {/* Center Section: Profile & Version Dropdowns */}
                    <div className="flex items-center gap-2 px-4 border-x border-border/50">
                        <Select value={activeProfileId} onValueChange={onProfileChange} disabled={isLoading || isFirstRun}>
                            <SelectTrigger className="h-8 w-[180px] text-sm bg-background/50">
                                <SelectValue placeholder={isFirstRun ? "No profiles yet" : "Select Profile"} />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={activeResumeVersion} onValueChange={onResumeVersionChange} disabled={!activeProfileId}>
                            <SelectTrigger className="h-8 w-[80px] text-sm bg-background/50">
                                <SelectValue placeholder="v1" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeProfileResumes.map(r => (
                                    <SelectItem key={r.id} value={r.version.toString()}>v{r.version}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Right Section: Navigation & View Mode */}
                    <div className="flex items-center gap-3 min-w-fit ml-auto">
                        <Button
                            variant={isFirstRun ? "default" : "ghost"}
                            size="sm"
                            onClick={() => router.push("/resumes")}
                            className={cn(
                                "h-8 text-xs",
                                isFirstRun && "animate-pulse ring-2 ring-primary/40"
                            )}
                        >
                            {isFirstRun && <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
                            Manage Profiles & Resumes
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/archived")} className="h-8 text-xs">
                            <Archive className="h-3.5 w-3.5 mr-1.5" /> Archived
                        </Button>

                        <div className="h-5 w-px bg-border/50" />

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant={viewMode === "flat" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => onViewModeChange("flat")}
                                className="h-8 text-xs px-3"
                            >
                                All
                            </Button>
                            <Button
                                variant={viewMode === "grouped" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => onViewModeChange("grouped")}
                                className="h-8 text-xs px-3"
                            >
                                Hierarchical
                            </Button>
                        </div>

                        <div className="h-5 w-px bg-border/50" />

                        <InfoDialog />
                        <SettingsDialog />
                    </div>
                </div>
            </div>
        </header>
    )
}
