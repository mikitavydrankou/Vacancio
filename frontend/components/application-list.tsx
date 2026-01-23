"use client"

import type React from "react"

import { useState, useMemo } from "react"
import Link from "next/link"
import type { JobApplication, ApplicationStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, ChevronRight, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveApplication } from "@/lib/storage"
import { STATUS_CONFIG, STATUSES } from "@/lib/constants/application"
import { isFieldEmpty, isAppComplete } from "@/lib/utils/validation"

interface ApplicationListProps {
  applications: JobApplication[]
  onUpdate: () => void
}

type MissingFieldFilter = "all" | "missing_description" | "missing_requirements" | "missing_responsibilities" | "missing_stack" | "complete"

const MISSING_FIELD_CONFIG: Record<MissingFieldFilter, { label: string }> = {
  all: { label: "All Fields" },
  missing_description: { label: "No Description" },
  missing_requirements: { label: "No Requirements" },
  missing_responsibilities: { label: "No Responsibilities" },
  missing_stack: { label: "No Tech Stack" },
  complete: { label: "Complete" },
}

export function ApplicationList({ applications, onUpdate }: ApplicationListProps) {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all")
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [missingFieldFilter, setMissingFieldFilter] = useState<MissingFieldFilter>("all")

  const techStats = useMemo(() => {
    const stats = new Map<string, number>()
    applications.forEach((app) => {
      app.techStack.forEach((tech) => {
        stats.set(tech, (stats.get(tech) || 0) + 1)
      })
    })
    return Array.from(stats.entries()).sort((a, b) => b[1] - a[1])
  }, [applications])

  const missingFieldStats = useMemo(() => {
    return {
      missing_description: applications.filter(app => isFieldEmpty(app.description)).length,
      missing_requirements: applications.filter(app => isFieldEmpty(app.requirements)).length,
      missing_responsibilities: applications.filter(app => isFieldEmpty(app.responsibilities)).length,
      missing_stack: applications.filter(app => isFieldEmpty(app.techStack)).length,
      complete: applications.filter(app => isAppComplete(app)).length,
    }
  }, [applications])

  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => {
        if (selectedTechs.length === 0) return true
        return selectedTechs.every((tech) => app.techStack.includes(tech))
      })
      .filter((app) => {
        switch (missingFieldFilter) {
          case "missing_description": return isFieldEmpty(app.description)
          case "missing_requirements": return isFieldEmpty(app.requirements)
          case "missing_responsibilities": return isFieldEmpty(app.responsibilities)
          case "missing_stack": return isFieldEmpty(app.techStack)
          case "complete": return isAppComplete(app)
          default: return true
        }
      })
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
  }, [applications, statusFilter, selectedTechs, missingFieldFilter])

  const handleStatusChange = (e: React.MouseEvent, app: JobApplication, newStatus: ApplicationStatus) => {
    e.preventDefault()
    e.stopPropagation()

    const updatedApp: JobApplication = {
      ...app,
      status: newStatus,
      responded: ["screening", "interview", "offer"].includes(newStatus),
      respondedAt: newStatus === "screening" && !app.respondedAt ? new Date() : app.respondedAt,
      interviewScheduled: newStatus === "interview",
      offerReceived: newStatus === "offer",
      rejected: newStatus === "rejected",
      rejectedAt: newStatus === "rejected" && !app.rejectedAt ? new Date() : app.rejectedAt,
    }

    saveApplication(updatedApp)
    onUpdate()
  }

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  const getPreviewTechStack = (techStack: string[]) => {
    return techStack.slice(0, 3)
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Filter by Tech Stack</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {techStats.map(([tech, count]) => (
              <button
                key={tech}
                onClick={() => toggleTech(tech)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  selectedTechs.includes(tech)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                )}
              >
                {tech}
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    selectedTechs.includes(tech) ? "bg-primary-foreground/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
          {selectedTechs.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Showing apps with <span className="font-medium text-foreground">ALL</span> selected technologies ({selectedTechs.length} selected)
              </span>
              <button
                onClick={() => setSelectedTechs([])}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Filter by Missing Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(MISSING_FIELD_CONFIG) as MissingFieldFilter[]).map((key) => {
              const count = key === "all" ? applications.length : missingFieldStats[key as keyof typeof missingFieldStats]
              return (
                <button
                  key={key}
                  onClick={() => setMissingFieldFilter(key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    missingFieldFilter === key
                      ? key === "complete"
                        ? "bg-green-500/20 text-green-400"
                        : key.startsWith("missing_")
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                  )}
                >
                  {MISSING_FIELD_CONFIG[key].label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    missingFieldFilter === key ? "bg-black/20" : "bg-muted",
                  )}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Applications list */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium">Applications ({filteredApps.length})</CardTitle>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ApplicationStatus | "all")}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredApps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No applications match filters</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredApps.map((app) => (
                <div key={app.id} className="flex items-center p-4 hover:bg-secondary/50 transition-colors group">
                  <Link href={`/application/${app.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium truncate">{app.position}</span>
                      <span className="text-muted-foreground text-sm">at {app.company}</span>
                      {!isAppComplete(app) && (
                        <span className="text-amber-500" title="Missing fields">
                          <AlertCircle className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(app.techStack || []).slice(0, 3).map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className={cn(
                            "text-xs font-normal px-2 py-0",
                            selectedTechs.includes(tech) && "bg-primary/20 text-primary",
                          )}
                        >
                          {tech}
                        </Badge>
                      ))}
                      {(app.techStack || []).length > 3 && (
                        <span className="text-xs text-muted-foreground">+{(app.techStack || []).length - 3}</span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 ml-4">
                    <Select
                      value={app.status}
                      onValueChange={(newStatus) => {
                        const fakeEvent = { preventDefault: () => { }, stopPropagation: () => { } } as React.MouseEvent
                        handleStatusChange(fakeEvent, app, newStatus as ApplicationStatus)
                      }}
                    >
                      <SelectTrigger
                        className={cn("h-7 text-xs border-0 w-32", STATUS_CONFIG[app.status]?.color || "bg-zinc-500/20 text-zinc-400")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            <span className={cn("px-2 py-0.5 rounded text-xs", STATUS_CONFIG[status].color)}>
                              {STATUS_CONFIG[status].label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Link href={`/application/${app.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
