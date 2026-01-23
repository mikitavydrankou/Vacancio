import { useState, useRef } from "react"
import type { Resume, JobSource, JobApplication, ResumeProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Upload, Link as LinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { uploadResume } from "@/lib/api"
import { detectJobSourceFromText, getSourceLabel } from "@/lib/job-parser"
import { SOURCES } from "@/lib/constants/application"

interface AddJobFormProps {
    resumes: Resume[]
    activeProfileId: string
    activeResumeVersion: string
    onSubmit: (app: Partial<JobApplication>) => Promise<void>
    onRefresh: () => Promise<void>
}

export function AddJobForm({
    resumes,
    activeProfileId,
    activeResumeVersion,
    onSubmit,
    onRefresh,
}: AddJobFormProps) {
    const { toast } = useToast()
    const [description, setDescription] = useState("")
    const [jobUrl, setJobUrl] = useState("")
    const [selectedSource, setSelectedSource] = useState<JobSource>("other")
    const [parseSuccess, setParseSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeProfileId) return

        try {
            await uploadResume(activeProfileId, file)
            await onRefresh()
        } catch (e) {
            console.error(e)
            alert("Upload failed")
        }
    }

    const handleUrlSubmit = async () => {
        if (!description || !activeProfileId) return

        // Default to latest version if not selected
        let targetVersion = activeResumeVersion ? parseInt(activeResumeVersion) : null
        if (!targetVersion) {
            const pResumes = resumes.filter(r => r.profileId === activeProfileId)
            if (pResumes.length > 0) {
                targetVersion = Math.max(...pResumes.map(r => r.version))
            } else {
                toast({ title: "Error", description: "No resume version found. Please upload one first.", variant: "destructive" })
                return
            }
        }

        // Capture data
        const textToProcess = description
        const currentJobUrl = jobUrl
        const profileIdToUse = activeProfileId
        const sourceToUse = selectedSource

        // Clear UI immediately
        setDescription("")
        setJobUrl("")


        toast({
            title: "Queued",
            description: "Job added to queue for parsing.",
        })

        try {
            // Auto-detect source from text if "other" is selected
            const finalSource = sourceToUse === "other" ? detectJobSourceFromText(textToProcess) : sourceToUse

            // Find resume
            const targetResume = resumes.find(r => r.profileId === profileIdToUse && r.version === targetVersion)
            if (!targetResume) return

            const app: Partial<JobApplication> = {
                profileId: profileIdToUse,
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
            }

            await onSubmit(app)
        } catch (error) {
            console.error("Failed to add job:", error)
            toast({
                title: "Error",
                description: "Failed to queue job.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="space-y-4 p-4 bg-card rounded-xl border border-border shadow-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Application
            </h3>

            <div className="space-y-3">
                {/* Source Selection */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Source</label>
                    <Select value={selectedSource} onValueChange={(v) => setSelectedSource(v as JobSource)}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="other">Auto-detect</SelectItem>
                            {SOURCES.filter(s => s !== "other").map((s) => (
                                <SelectItem key={s} value={s}>{getSourceLabel(s)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Job URL Input */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1 flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> Job URL (Optional)
                    </label>
                    <Input
                        placeholder="https://..."
                        value={jobUrl}
                        onChange={(e) => setJobUrl(e.target.value)}
                        disabled={!activeProfileId}
                        className="h-9"
                    />
                </div>

                {/* Text Area */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground ml-1">Job Description</label>
                    <textarea
                        placeholder={activeProfileId ? "Paste job description here..." : "Select a profile to start"}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={!activeProfileId}
                        className={cn(
                            "w-full px-3 py-2.5 text-sm bg-background border rounded-lg resize-none min-h-[100px]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all",
                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
                            parseSuccess && "border-green-500/50"
                        )}
                        rows={6}
                    />
                </div>


                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button
                        onClick={handleUrlSubmit}
                        disabled={!description || !activeProfileId}
                        className="flex-1 shadow-sm"
                    >

                        <Plus className="h-4 w-4 mr-2" />
                        Add Application
                    </Button>

                    <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={!activeProfileId}
                        title="Upload new resume version"
                        className="shrink-0"
                    >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
