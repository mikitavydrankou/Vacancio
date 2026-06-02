import { useState, type KeyboardEvent } from "react"
import type { JobSource, JobApplication, Resume } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Link as LinkIcon, Sparkles, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { detectJobSourceFromText, getSourceLabel } from "@/lib/job-parser"
import { SOURCES } from "@/lib/constants/application"

interface AddJobFormProps {
    resumes: Resume[]
    activeProfileId: string
    activeResumeVersion: string
    onSubmit: (app: Partial<JobApplication>) => Promise<void>
}

export function AddJobForm({
    resumes,
    activeProfileId,
    activeResumeVersion,
    onSubmit,
}: AddJobFormProps) {
    const { toast } = useToast()
    const [description, setDescription] = useState("")
    const [jobUrl, setJobUrl] = useState("")
    const [selectedSource, setSelectedSource] = useState<JobSource>("other")

    const hasProfile = Boolean(activeProfileId)
    const profileResumes = resumes.filter((r) => r.profileId === activeProfileId)
    const hasResume = profileResumes.length > 0
    const canSubmit = hasProfile && hasResume && description.trim().length > 0

    const handleSubmit = async () => {
        if (!description.trim() || !activeProfileId) return

        // Default to latest version if none selected
        let targetVersion = activeResumeVersion ? parseInt(activeResumeVersion) : null
        if (!targetVersion) {
            if (profileResumes.length > 0) {
                targetVersion = Math.max(...profileResumes.map((r) => r.version))
            } else {
                toast({
                    title: "No resume found",
                    description: "Upload a resume version first (Manage Profiles & Resumes).",
                    variant: "destructive",
                })
                return
            }
        }

        const textToProcess = description
        const currentJobUrl = jobUrl
        const sourceToUse = selectedSource

        // Clear UI immediately for a snappy feel
        setDescription("")
        setJobUrl("")
        setSelectedSource("other")

        toast({ title: "Queued", description: "Job added — AI is parsing the details." })

        try {
            const finalSource = sourceToUse === "other" ? detectJobSourceFromText(textToProcess) : sourceToUse
            const targetResume = profileResumes.find((r) => r.version === targetVersion)
            if (!targetResume) return

            await onSubmit({
                profileId: activeProfileId,
                resumeId: targetResume.id,
                resumeVersion: targetVersion,
                url: currentJobUrl,
                company: "Parsing...",
                position: "Parsing...",
                location: "",
                techStack: [],
                niceToHaveStack: [],
                responsibilities: [],
                requirements: [],
                description: "",
                rawData: textToProcess,
                status: "parsing",
                source: finalSource,
            })
        } catch (error) {
            console.error("Failed to add job:", error)
            toast({ title: "Error", description: "Failed to queue job.", variant: "destructive" })
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        // Cmd/Ctrl + Enter submits
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            handleSubmit()
        }
    }

    const hint = !hasProfile
        ? "Select or create a profile to start adding applications."
        : !hasResume
            ? "Upload a resume version first — open Manage Profiles & Resumes."
            : "Tip: press ⌘/Ctrl + Enter to add."

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Plus className="h-3.5 w-3.5" />
                    </span>
                    Add Application
                </h3>
                <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Paste a posting — AI fills in the rest
                </span>
            </div>

            <div className="p-5 space-y-3">
                {/* Primary: job description */}
                <textarea
                    placeholder={
                        hasProfile
                            ? "Paste the full job description here…"
                            : "Select a profile to start"
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!hasProfile}
                    rows={5}
                    className={cn(
                        "w-full px-3.5 py-3 text-sm bg-background border border-border rounded-lg resize-y min-h-[120px]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all",
                        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/40",
                    )}
                />

                {/* Secondary: source + url */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <Select
                        value={selectedSource}
                        onValueChange={(v) => setSelectedSource(v as JobSource)}
                        disabled={!hasProfile}
                    >
                        <SelectTrigger className="h-9 w-full sm:w-44 shrink-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="other">Auto-detect source</SelectItem>
                            {SOURCES.filter((s) => s !== "other").map((s) => (
                                <SelectItem key={s} value={s}>{getSourceLabel(s)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Job URL (optional)"
                            value={jobUrl}
                            onChange={(e) => setJobUrl(e.target.value)}
                            disabled={!hasProfile}
                            className="h-9 pl-9"
                        />
                    </div>
                </div>

                {/* Footer: hint + action */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-muted-foreground truncate">{hint}</p>
                    <Button onClick={handleSubmit} disabled={!canSubmit} className="shrink-0 gap-1.5">
                        Add Application
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
