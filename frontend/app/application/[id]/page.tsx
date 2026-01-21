"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { JobApplication, ApplicationStatus } from "@/lib/types"
import { getApplications, saveApplication, deleteApplication } from "@/lib/storage"
import { getSourceLabel, getSourceColor } from "@/lib/job-parser"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ExternalLink, Building2, MapPin, Calendar, Banknote, FileText, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  parsing: { label: "Parsing", color: "bg-purple-500/20 text-purple-400" },
  no_response: { label: "No Response", color: "bg-zinc-500/20 text-zinc-400" },
  screening: { label: "Screening", color: "bg-blue-500/20 text-blue-400" },
  interview: { label: "Interview", color: "bg-amber-500/20 text-amber-400" },
  offer: { label: "Offer", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
}

// User-selectable statuses (excludes "parsing" which is only for internal use)
const SELECTABLE_STATUSES: ApplicationStatus[] = [
  "no_response",
  "screening",
  "interview",
  "offer",
  "rejected",
]

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [app, setApp] = useState<JobApplication | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const apps = getApplications()
    const found = apps.find((a) => a.id === params.id)
    if (found) {
      setApp(found)
    }
  }, [params.id])

  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Application not found</p>
      </div>
    )
  }

  const handleStatusChange = (status: ApplicationStatus) => {
    const updated: JobApplication = {
      ...app,
      status,
      responded: ["screening", "interview", "offer"].includes(status) || app.responded,
      respondedAt: status === "screening" && !app.respondedAt ? new Date() : app.respondedAt,
      interviewScheduled: status === "interview" || app.interviewScheduled,
      offerReceived: status === "offer" || app.offerReceived,
      rejected: status === "rejected",
      rejectedAt: status === "rejected" ? new Date() : undefined,
    }
    saveApplication(updated)
    setApp(updated)
  }

  const handleSave = () => {
    saveApplication(app)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteApplication(app.id)
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{app.position}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Building2 className="h-4 w-4" />
              <span>{app.company}</span>
            </div>
          </div>
          <Badge className={getSourceColor(app.source)}>{getSourceLabel(app.source)}</Badge>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg mb-6">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
            <SelectTrigger className={cn("w-44 h-9", STATUS_CONFIG[app.status].color)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SELECTABLE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button variant="outline" size="sm" asChild>
            <a href={app.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Original
            </a>
          </Button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {app.location && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="font-medium">{app.location}</p>
            </div>
          )}
          {app.salary && (
            <div className="p-4 bg-card border border-border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Banknote className="h-4 w-4" />
                Salary
              </div>
              <p className="font-medium">{app.salary}</p>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Applied
            </div>
            <p className="font-medium">{new Date(app.appliedAt).toLocaleDateString()}</p>
          </div>
          <div className="p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <FileText className="h-4 w-4" />
              Resume Version
            </div>
            <p className="font-medium">v{app.resumeVersion}</p>
          </div>
        </div>

        {/* Tech stack */}
        {app.techStack.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {app.techStack.map((tech) => (
                <Badge key={tech} variant="secondary" className="text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {app.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Job Description</h3>
            <p className="text-sm leading-relaxed bg-card border border-border rounded-lg p-4">{app.description}</p>
          </div>
        )}

        {/* Editable notes section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Your Notes</h3>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 bg-card border border-border rounded-lg p-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Interview Notes</label>
                <Textarea
                  value={app.interviewNotes || ""}
                  onChange={(e) => setApp({ ...app, interviewNotes: e.target.value })}
                  placeholder="Questions asked, impressions..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Interview Recording URL</label>
                <Input
                  value={app.interviewRecordingUrl || ""}
                  onChange={(e) => setApp({ ...app, interviewRecordingUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Offer Amount</label>
                <Input
                  value={app.offerAmount || ""}
                  onChange={(e) => setApp({ ...app, offerAmount: e.target.value })}
                  placeholder="32,000 PLN / month"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">General Notes</label>
                <Textarea
                  value={app.notes || ""}
                  onChange={(e) => setApp({ ...app, notes: e.target.value })}
                  placeholder="Any other notes..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              {app.interviewNotes && (
                <div>
                  <span className="text-xs text-muted-foreground">Interview Notes</span>
                  <p className="text-sm">{app.interviewNotes}</p>
                </div>
              )}
              {app.interviewRecordingUrl && (
                <div>
                  <span className="text-xs text-muted-foreground">Recording</span>
                  <a
                    href={app.interviewRecordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline block"
                  >
                    {app.interviewRecordingUrl}
                  </a>
                </div>
              )}
              {app.offerAmount && (
                <div>
                  <span className="text-xs text-muted-foreground">Offer Amount</span>
                  <p className="text-sm font-medium text-green-400">{app.offerAmount}</p>
                </div>
              )}
              {app.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Notes</span>
                  <p className="text-sm">{app.notes}</p>
                </div>
              )}
              {!app.interviewNotes && !app.interviewRecordingUrl && !app.offerAmount && !app.notes && (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              )}
            </div>
          )}
        </div>

        {/* Delete button */}
        <div className="border-t border-border pt-6">
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Application
          </Button>
        </div>
      </div>
    </div>
  )
}
