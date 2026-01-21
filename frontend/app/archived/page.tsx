"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Resume, JobApplication, ApplicationStatus, ResumeProfile } from "@/lib/types"
import {
  fetchProfiles,
  fetchResumes,
  fetchApplications,
  updateApplicationStatus,
  deleteApplication,
  toggleFavorite,
  toggleArchive
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, ChevronLeft, Star, Archive } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  no_response: { label: "No Response", color: "bg-zinc-500/20 text-zinc-400" },
  screening: { label: "Screening", color: "bg-blue-500/20 text-blue-400" },
  interview: { label: "Interview", color: "bg-amber-500/20 text-amber-400" },
  offer: { label: "Offer", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
}

const STATUSES: ApplicationStatus[] = [
  "no_response",
  "screening",
  "interview",
  "offer",
  "rejected",
]

export default function ArchivedPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<ResumeProfile[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setIsLoading(true)
    try {
      const [profData, resumeData, appData] = await Promise.all([
        fetchProfiles(),
        fetchResumes(),
        fetchApplications()
      ])
      setProfiles(profData)
      setResumes(resumeData)
      setApplications(appData.filter(a => a.isArchived))
    } catch (error) {
      console.error("Failed to load data", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (app: JobApplication, newStatus: ApplicationStatus) => {
    const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: newStatus } : a)
    setApplications(updatedApps)
    try {
      await updateApplicationStatus(app.id, newStatus)
    } catch {
      setApplications(applications)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id)
      setApplications(applications.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleToggleFavorite = async (app: JobApplication) => {
    const newValue = !app.isFavorite
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isFavorite: newValue } : a))
    try {
      await toggleFavorite(app.id, newValue)
    } catch {
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isFavorite: !newValue } : a))
    }
  }

  const handleUnarchive = async (app: JobApplication) => {
    setApplications(prev => prev.filter(a => a.id !== app.id))
    try {
      await toggleArchive(app.id, false)
    } catch {
      setApplications(prev => [...prev, app])
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const appDate = new Date(date) // Ensure it's a Date object
    const diff = now.getTime() - appDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365) return appDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return appDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Archive className="h-6 w-6" /> Archived Applications
              </h1>
              <Badge variant="secondary">{applications.length}</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No archived applications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map(app => (
                <div
                  key={app.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer bg-card",
                    "border-transparent hover:border-border hover:bg-secondary/50"
                  )}
                  onClick={() => router.push(`/applications/${app.id}`)}
                >
                  {/* Favorite */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(app)
                    }}
                    className="p-1 hover:bg-amber-500/10 rounded transition-colors"
                  >
                    <Star className={cn("h-4 w-4", app.isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-400")} />
                  </button>
                  
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{app.position}</span>
                      <span className="text-muted-foreground text-sm truncate">at {app.company}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {app.techStack.slice(0, 6).map((tech) => (
                        <span key={tech} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{tech}</span>
                      ))}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="hidden md:flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 font-normal text-muted-foreground">
                      {profiles.find(p => p.id === app.profileId)?.name} v{app.resumeVersion}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{formatDate(app.appliedAt)}</span>
                  </div>

                  {/* Status */}
                  <Select value={app.status} onValueChange={(v) => handleStatusChange(app, v as ApplicationStatus)}>
                    <SelectTrigger className={cn("h-7 text-xs w-28 border-0 shadow-none", STATUS_CONFIG[app.status].color)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className="text-xs">{STATUS_CONFIG[s].label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Actions */}
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-secondary rounded"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnarchive(app)
                    }}
                    title="Unarchive"
                    className="p-1.5 hover:bg-green-500/10 rounded"
                  >
                    <Archive className="h-3.5 w-3.5 text-muted-foreground hover:text-green-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(app.id)
                    }}
                    className="p-1.5 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
