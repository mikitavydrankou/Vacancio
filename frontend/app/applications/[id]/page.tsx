"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchApplication, updateApplicationStatus, updateApplication } from "@/lib/api"
import type { JobApplication, ApplicationStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ExternalLink, Calendar, MapPin, Building2, Banknote, Briefcase, GraduationCap, Laptop, CheckCircle2, Edit, Save, X } from "lucide-react"
import { cn, ensureAbsoluteUrl } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSourceColor, getSourceLabel } from "@/lib/job-parser"
import { EditTagsField } from "@/components/edit-tags-field"
import { EditListField } from "@/components/edit-list-field"

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  parsing: { label: "Parsing", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900" },
  no_response: { label: "No Response", color: "bg-zinc-500/10 text-zinc-500 border-zinc-200 dark:border-zinc-800" },
  screening: { label: "Screening", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900" },
  interview: { label: "Interview", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900" },
  offer: { label: "Offer", color: "bg-green-500/10 text-green-600 border-green-200 dark:border-green-900" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900" },
}

const STATUSES: ApplicationStatus[] = [
  "parsing",
  "no_response",
  "screening",
  "interview",
  "offer",
  "rejected",
]

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [app, setApp] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedApp, setEditedApp] = useState<JobApplication | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!params.id) return

    fetchApplication(params.id)
      .then(setApp)
      .catch(err => {
        console.error("Failed to fetch app", err)
      })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Application Not Found</h2>
          <Button variant="link" onClick={() => router.push("/")} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!app) return
    const updated = {
      ...app,
      status: newStatus,
      rejectedAt: newStatus === "rejected" ? new Date() : app.rejectedAt,
    }
    setApp(updated)
    try {
      await updateApplicationStatus(app.id, newStatus)
    } catch {
      setApp(app)
      alert("Failed to update status")
    }
  }

  const handleEdit = () => {
    if (app) {
      setEditedApp({ ...app })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (!editedApp || !app) return

    setIsSaving(true)
    try {
      const updated = await updateApplication(app.id, editedApp)
      setApp(updated)
      setIsEditing(false)
      setEditedApp(null)
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedApp(null)
  }

  const currentApp = isEditing ? editedApp : app
  if (!currentApp) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={currentApp.position}
                      onChange={(e) => setEditedApp({ ...currentApp, position: e.target.value })}
                      className="text-xl font-bold h-auto py-1"
                      placeholder="Position"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={currentApp.company}
                        onChange={(e) => setEditedApp({ ...currentApp, company: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Company"
                      />
                      <Input
                        value={currentApp.location || ""}
                        onChange={(e) => setEditedApp({ ...currentApp, location: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Location"
                      />
                      <Input
                        value={currentApp.url}
                        onChange={(e) => setEditedApp({ ...currentApp, url: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="URL"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-xl font-bold leading-tight">
                      {app.url ? (
                        <a
                          href={ensureAbsoluteUrl(app.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline decoration-2 decoration-primary/50 underline-offset-4"
                        >
                          {app.position}
                        </a>
                      ) : (
                        <span>{app.position}</span>
                      )}
                    </h1>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <Building2 className="h-4 w-4" />
                      <span>{app.company}</span>
                      {app.location && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{app.location}</span>
                        </>
                      )}
                      <div className="ml-2">
                        <Badge
                          variant="secondary"
                          className={cn("px-1.5 py-0 text-[10px] font-medium h-5", getSourceColor(app.source || "other"))}
                        >
                          {getSourceLabel(app.source || "other")}
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  {app.url && (
                    <a
                      href={ensureAbsoluteUrl(app.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
                    >
                      <span>Original Posting</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <Select value={app.status} onValueChange={(v) => handleStatusChange(v as ApplicationStatus)}>
                    <SelectTrigger className={cn("w-[140px] h-9 border", STATUS_CONFIG[app.status].color)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleEdit} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} size="sm" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Key Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wide">
                    <Banknote className="h-3.5 w-3.5" /> Salary
                  </div>
                  {isEditing ? (
                    <Input
                      value={currentApp.salary || ""}
                      onChange={(e) => setEditedApp({ ...currentApp, salary: e.target.value })}
                      className="h-8 font-semibold"
                      placeholder="Not specified"
                    />
                  ) : (
                    <div className="font-semibold">{app.salary || "Not specified"}</div>
                  )}
                </div>
                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wide">
                    <Briefcase className="h-3.5 w-3.5" /> Work Mode
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={currentApp.workMode || ""}
                        onChange={(e) => setEditedApp({ ...currentApp, workMode: e.target.value })}
                        className="h-8 font-semibold"
                        placeholder="Not specified"
                      />
                      <Input
                        value={currentApp.employmentType || ""}
                        onChange={(e) => setEditedApp({ ...currentApp, employmentType: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Employment type"
                      />
                    </div>
                  ) : (
                    <div className="font-semibold capitalize">
                      {app.workMode || "Not specified"}
                      {app.employmentType && (
                        <span className="text-muted-foreground font-normal ml-1">
                          ({app.employmentType})
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-2 uppercase tracking-wide">
                    <Calendar className="h-3.5 w-3.5" /> Applied
                  </div>
                  <div className="font-semibold">
                    {new Date(app.appliedAt).toLocaleDateString()}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({new Date(app.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  Responsibilities
                </h3>
                {isEditing ? (
                  <EditListField
                    items={currentApp.responsibilities || []}
                    onChange={(items) => setEditedApp({ ...currentApp, responsibilities: items })}
                    placeholder="Add responsibility"
                    multiline
                  />
                ) : (
                  <>
                    {app.responsibilities && app.responsibilities.length > 0 ? (
                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm text-muted-foreground marker:text-primary/50">
                        {app.responsibilities.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  Requirements
                </h3>
                {isEditing ? (
                  <EditListField
                    items={currentApp.requirements || []}
                    onChange={(items) => setEditedApp({ ...currentApp, requirements: items })}
                    placeholder="Add requirement"
                    multiline
                  />
                ) : (
                  <>
                    {app.requirements && app.requirements.length > 0 ? (
                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-sm text-muted-foreground marker:text-primary/50">
                        {app.requirements.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </>
                )}
              </div>

              {/* Description Text */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h3 className="text-base font-semibold">Description</h3>
                {isEditing ? (
                  <Textarea
                    value={currentApp.description || ""}
                    onChange={(e) => setEditedApp({ ...currentApp, description: e.target.value })}
                    className="min-h-[200px] text-sm"
                    placeholder="Job description"
                  />
                ) : (
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {app.description || "-"}
                  </div>
                )}
              </div>

              {/* Raw Data */}
              {!isEditing && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Raw Data</h3>
                  {app.rawData ? (
                    <details className="group border rounded-lg bg-card open:ring-1 open:ring-ring shadow-sm">
                      <summary className="cursor-pointer p-4 font-medium text-sm flex items-center justify-between select-none">
                        <span>Show original scraped text</span>
                        <span className="transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-4 pt-0 border-t bg-secondary/10 overflow-x-auto">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                          {app.rawData}
                        </pre>
                      </div>
                    </details>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
              {/* Tech Stack */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-primary" />
                  Tech Stack
                </h3>
                {isEditing ? (
                  <EditTagsField
                    tags={currentApp.techStack || []}
                    onChange={(tags) => setEditedApp({ ...currentApp, techStack: tags })}
                    placeholder="Add technology and press Enter"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {app.techStack.length > 0 ? (
                      app.techStack.map(tech => (
                        <Badge key={tech} variant="secondary" className="px-2.5 py-1 text-sm font-normal">
                          {tech}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic text-sm">No tech stack detected</span>
                    )}
                  </div>
                )}
              </div>

              {/* Nice to Have */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-4.5 w-4.5 text-primary" />
                  Nice to Have
                </h3>
                {isEditing ? (
                  <EditTagsField
                    tags={currentApp.niceToHaveStack || []}
                    onChange={(tags) => setEditedApp({ ...currentApp, niceToHaveStack: tags })}
                    placeholder="Add nice-to-have tech and press Enter"
                    variant="outline"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {app.niceToHaveStack && app.niceToHaveStack.length > 0 ? (
                      app.niceToHaveStack.map(tech => (
                        <Badge key={tech} variant="outline" className="px-2.5 py-1 text-sm font-normal text-muted-foreground border-dashed">
                          {tech}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 p-6 rounded-xl border bg-card shadow-sm">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Metadata</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>CV Version</span>
                    <span className="font-mono">v{app.resumeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID</span>
                    <span className="font-mono text-xs">{app.id.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
