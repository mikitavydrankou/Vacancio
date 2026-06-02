"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    fetchResumes,
    uploadResume,
    updateResume,
    deleteResume,
    fetchApplications
} from "@/lib/api"
import { API_BASE } from "@/lib/api/base"
import type { Resume, JobApplication, ResumeProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    LayoutDashboard,
    Plus,
    Trash2,
    Pencil,
    Check,
    X,
    FileText,
    Upload,
    Briefcase,
    Send,
    MessageSquare,
    CheckCircle2,
    Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function ResumesPage() {
    const router = useRouter()
    const [profiles, setProfiles] = useState<ResumeProfile[]>([])
    const [activeProfileId, setActiveProfileId] = useState<string>("")
    const [resumes, setResumes] = useState<Resume[]>([])
    const [applications, setApplications] = useState<JobApplication[]>([])

    const [newProfileName, setNewProfileName] = useState("")
    const [isCreatingProfile, setIsCreatingProfile] = useState(false)
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
    const [editProfileName, setEditProfileName] = useState("")
    const [editingResumeId, setEditingResumeId] = useState<string | null>(null)
    const [editResumeName, setEditResumeName] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async (profileIdOverride?: string) => {
        try {
            const allProfiles = await fetchProfiles()
            setProfiles(allProfiles)

            // Determine active profile
            let targetId = profileIdOverride || activeProfileId
            if (!targetId || !allProfiles.find(p => p.id === targetId)) {
                targetId = allProfiles.length > 0 ? allProfiles[0].id : ""
            }

            setActiveProfileId(targetId)

            if (targetId) {
                const [resumeData, appData] = await Promise.all([
                    fetchResumes(targetId),
                    fetchApplications(targetId)
                ])
                setResumes(resumeData.sort((a, b) => b.version - a.version))
                setApplications(appData)
            } else {
                setResumes([])
                setApplications([])
            }
        } catch (error) {
            console.error("Failed to load data", error)
        }
    }

    // Effect to reload resumes/apps when activeProfile changes
    useEffect(() => {
        if (activeProfileId) {
            (async () => {
                const [resumeData, appData] = await Promise.all([
                    fetchResumes(activeProfileId),
                    fetchApplications(activeProfileId)
                ])
                setResumes(resumeData.sort((a, b) => b.version - a.version))
                setApplications(appData)
            })()
        }
    }, [activeProfileId])


    const handleCreateProfile = async () => {
        if (!newProfileName.trim()) return
        try {
            const newProfile = await createProfile(newProfileName)
            setNewProfileName("")
            setIsCreatingProfile(false)
            loadData(newProfile.id)
        } catch (error) {
            console.error(error)
            alert("Failed to create profile")
        }
    }

    const handleDeleteProfile = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm("Delete this profile? Its resumes and all tracked applications will be permanently removed.")) {
            try {
                await deleteProfile(id)
                loadData()
            } catch (error) {
                console.error(error)
                alert("Failed to delete profile")
            }
        }
    }

    const handleDeleteResume = async (resume: Resume) => {
        const count = getResumeStats(resume.version).total
        const message = count > 0
            ? `Delete Version ${resume.version}? This also permanently deletes ${count} application${count === 1 ? "" : "s"} tracked under it.`
            : `Delete Version ${resume.version}?`
        if (!confirm(message)) return
        try {
            await deleteResume(resume.id)
            loadData(activeProfileId)
        } catch (error) {
            console.error(error)
            alert("Failed to delete resume")
        }
    }

    const startEditProfile = (profile: ResumeProfile, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProfileId(profile.id)
        setEditProfileName(profile.name)
    }

    const saveProfileName = async () => {
        const name = editProfileName.trim()
        const id = editingProfileId
        setEditingProfileId(null)
        if (!id || !name) return
        try {
            await updateProfile(id, name)
            loadData(activeProfileId)
        } catch (error) {
            console.error(error)
            alert("Failed to rename profile (name may already be taken)")
        }
    }

    const startEditResume = (resume: Resume) => {
        setEditingResumeId(resume.id)
        setEditResumeName(resume.fileName.replace(/\.pdf$/i, ""))
    }

    const saveResumeName = async () => {
        const name = editResumeName.trim()
        const id = editingResumeId
        setEditingResumeId(null)
        if (!id || !name) return
        try {
            await updateResume(id, name)
            loadData(activeProfileId)
        } catch (error) {
            console.error(error)
            alert("Failed to rename resume")
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeProfileId) return

        try {
            await uploadResume(activeProfileId, file)
            loadData(activeProfileId)
        } catch (error) {
            console.error(error)
            alert("Failed to upload resume")
        }
    }

    // Stats Calculation per Resume Version
    const getResumeStats = (resumeVersion: number) => {
        const apps = applications.filter(a => a.resumeVersion === resumeVersion)
        const total = apps.length
        const responses = apps.filter(a => a.status !== "no_response").length
        const interviews = apps.filter(a => a.status === "interview" || a.status === "offer").length
        const offers = apps.filter(a => a.status === "offer").length

        return { total, responses, interviews, offers }
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Profiles */}
            <aside className="w-80 border-r border-border bg-card/50 flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 font-semibold">
                            <LayoutDashboard className="h-5 w-5" />
                            <span>Profiles</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="h-8 px-2">
                            Dashboard
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {profiles.map(profile => {
                        const profileResumes = resumes.filter(r => r.profileId === profile.id)
                        const profileApps = applications.filter(a => a.profileId === profile.id)
                        
                        if (editingProfileId === profile.id) {
                            return (
                                <div key={profile.id} className="rounded-lg border border-primary/50 bg-background p-2 space-y-2">
                                    <Input
                                        value={editProfileName}
                                        onChange={(e) => setEditProfileName(e.target.value)}
                                        autoFocus
                                        className="h-8 text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") saveProfileName()
                                            if (e.key === "Escape") setEditingProfileId(null)
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" className="h-7 flex-1 text-xs gap-1" onClick={saveProfileName}>
                                            <Check className="h-3 w-3" /> Save
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingProfileId(null)}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <button
                                key={profile.id}
                                onClick={() => setActiveProfileId(profile.id)}
                                className={cn(
                                    "w-full text-left px-3 py-3 rounded-lg text-sm group transition-colors border",
                                    activeProfileId === profile.id
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "hover:bg-muted text-foreground border-border hover:border-primary/50"
                                )}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <span className="font-medium truncate flex-1">{profile.name}</span>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <div
                                            role="button"
                                            onClick={(e) => startEditProfile(profile, e)}
                                            title="Rename profile"
                                            className={cn(
                                                "p-1 rounded hover:bg-primary/20",
                                                activeProfileId === profile.id && "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20"
                                            )}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </div>
                                        <div
                                            role="button"
                                            onClick={(e) => handleDeleteProfile(profile.id, e)}
                                            title="Delete profile"
                                            className={cn(
                                                "p-1 rounded hover:bg-red-500/20 hover:text-red-500",
                                                activeProfileId === profile.id && "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20"
                                            )}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-3 text-xs",
                                    activeProfileId === profile.id ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                    <span>{profileResumes.length} versions</span>
                                    <span>·</span>
                                    <span>{profileApps.length} apps</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="p-4 border-t border-border">
                    {isCreatingProfile ? (
                        <div className="space-y-2">
                            <Input
                                value={newProfileName}
                                onChange={e => setNewProfileName(e.target.value)}
                                placeholder="Profile Name"
                                className="h-9 text-sm"
                                autoFocus
                                onKeyDown={e => e.key === "Enter" && handleCreateProfile()}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" className="h-8 text-xs flex-1" onClick={handleCreateProfile}>Create</Button>
                                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setIsCreatingProfile(false)}>Cancel</Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setIsCreatingProfile(true)}>
                            <Plus className="h-4 w-4" /> New Profile
                        </Button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {activeProfileId && (
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-6 border-b">
                            <div>
                                <h1 className="text-3xl font-bold">{profiles.find(p => p.id === activeProfileId)?.name}</h1>
                                <p className="text-muted-foreground text-sm mt-2">
                                    {resumes.length} versions · {applications.length} applications total
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                                    <Upload className="h-4 w-4" /> Upload New Version
                                </Button>
                            </div>
                        </div>

                        {/* Versions List */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {resumes.map((resume) => {
                                const stats = getResumeStats(resume.version)
                                // file_path is stored as "data/uploads/<name>"; files are served at "/uploads/<name>"
                                const resumeUrl = resume.filePath
                                    ? `${API_BASE}/uploads/${resume.filePath.split("/").pop()}`
                                    : null
                                
                                return (
                                    <Card key={resume.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate">Version {resume.version}</span>
                                                    </CardTitle>
                                                    {editingResumeId === resume.id ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                value={editResumeName}
                                                                onChange={(e) => setEditResumeName(e.target.value)}
                                                                autoFocus
                                                                className="h-7 text-xs"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") saveResumeName()
                                                                    if (e.key === "Escape") setEditingResumeId(null)
                                                                }}
                                                            />
                                                            <Button size="icon" className="h-7 w-7 shrink-0" onClick={saveResumeName} title="Save">
                                                                <Check className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingResumeId(null)} title="Cancel">
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <CardDescription className="text-xs truncate">
                                                            {resume.fileName}
                                                        </CardDescription>
                                                    )}
                                                    <CardDescription className="text-xs">
                                                        {resume.uploadedAt.toLocaleDateString()}
                                                    </CardDescription>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {resumeUrl && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 h-7 text-xs"
                                                            onClick={() => window.open(resumeUrl, '_blank')}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View
                                                        </Button>
                                                    )}
                                                    <Badge variant="outline" className="font-mono text-xs">v{resume.version}</Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => startEditResume(resume)}
                                                        title="Rename"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleDeleteResume(resume)}
                                                        title="Delete version"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/30">
                                                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                                                        <Send className="h-3 w-3" /> Sent
                                                    </span>
                                                    <span className="text-2xl font-bold">{stats.total}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/30">
                                                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                                                        <MessageSquare className="h-3 w-3" /> Replies
                                                    </span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-bold">{stats.responses}</span>
                                                        {stats.total > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                ({Math.round((stats.responses / stats.total) * 100)}%)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/30">
                                                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                                                        <Briefcase className="h-3 w-3" /> Interviews
                                                    </span>
                                                    <span className="text-2xl font-bold">{stats.interviews}</span>
                                                </div>
                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/30">
                                                    <span className="text-xs text-muted-foreground uppercase font-medium flex items-center gap-1.5">
                                                        <CheckCircle2 className="h-3 w-3" /> Offers
                                                    </span>
                                                    <span className="text-2xl font-bold">{stats.offers}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}

                            {resumes.length === 0 && (
                                <div className="col-span-full text-center py-20 border-2 border-dashed rounded-lg text-muted-foreground">
                                    <p className="mb-2">No resumes uploaded for this profile yet.</p>
                                    <Button variant="link" onClick={() => fileInputRef.current?.click()}>Upload your first version</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!activeProfileId && (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>Select or create a profile to get started</p>
                    </div>
                )}
            </main>
        </div>
    )
}
