"use client"

import type { JobApplication, Resume, JobSource } from "@/lib/types"
import { Send, MessageSquare, Calendar, Trophy, AlertCircle, Globe } from "lucide-react"
import { getSourceLabel } from "@/lib/job-parser"

interface AnalyticsDashboardProps {
  applications: JobApplication[]
  resumes: Resume[]
  onFilterByMissing?: (field: string) => void
}

const isFieldEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function AnalyticsDashboard({ applications, resumes, onFilterByMissing }: AnalyticsDashboardProps) {
  const totalApplied = applications.length
  
  // Calculate stats based on status
  const responded = applications.filter((a) => 
    a.status === "screening" || a.status === "interview" || a.status === "offer" || a.respondedAt
  ).length
  const interviews = applications.filter((a) => 
    a.status === "interview" || a.status === "offer" || a.interviewDate
  ).length
  const offers = applications.filter((a) => 
    a.status === "offer"
  ).length

  const responseRate = totalApplied > 0 ? Math.round((responded / totalApplied) * 100) : 0
  const interviewRate = responded > 0 ? Math.round((interviews / responded) * 100) : 0

  // Source stats
  const sourceStats = new Map<string, number>()
  applications.forEach(app => {
    const source = app.source || "other"
    sourceStats.set(source, (sourceStats.get(source) || 0) + 1)
  })
  const sortedSources = Array.from(sourceStats.entries()).sort((a, b) => b[1] - a[1])

  const missingFieldsStats = {
    description: applications.filter(a => isFieldEmpty(a.description)).length,
    requirements: applications.filter(a => isFieldEmpty(a.requirements)).length,
    responsibilities: applications.filter(a => isFieldEmpty(a.responsibilities)).length,
    techStack: applications.filter(a => isFieldEmpty(a.techStack)).length,
  }

  const totalIncomplete = applications.filter(a => 
    isFieldEmpty(a.description) || 
    isFieldEmpty(a.requirements) || 
    isFieldEmpty(a.responsibilities) || 
    isFieldEmpty(a.techStack)
  ).length

  return (
    <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-card border border-border rounded-lg text-xs">
      <div className="flex items-center gap-1.5">
        <Send className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-lg font-semibold">{totalApplied}</span>
        <span className="text-muted-foreground">applied</span>
      </div>
      
      <div className="h-5 w-px bg-border" />
      
      <div className="flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-lg font-semibold text-cyan-400">{responseRate}%</span>
        <span className="text-muted-foreground">response ({responded})</span>
      </div>
      
      <div className="h-5 w-px bg-border" />
      
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-amber-400" />
        <span className="text-lg font-semibold text-amber-400">{interviewRate}%</span>
        <span className="text-muted-foreground">interviews ({interviews})</span>
      </div>
      
      <div className="h-5 w-px bg-border" />
      
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-green-400" />
        <span className="text-lg font-semibold text-green-400">{offers}</span>
        <span className="text-muted-foreground">offers</span>
      </div>

      {sortedSources.length > 0 && (
        <>
          <div className="h-5 w-px bg-border" />
          
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {sortedSources.map(([source, count]) => (
              <span
                key={source}
                className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground"
              >
                {getSourceLabel(source as JobSource)} ({count})
              </span>
            ))}
          </div>
        </>
      )}

      {totalIncomplete > 0 && (
        <>
          <div className="h-5 w-px bg-border" />
          
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            {[
              { key: "description", label: "desc", count: missingFieldsStats.description },
              { key: "requirements", label: "req", count: missingFieldsStats.requirements },
              { key: "responsibilities", label: "resp", count: missingFieldsStats.responsibilities },
              { key: "techStack", label: "stack", count: missingFieldsStats.techStack },
            ].filter(item => item.count > 0).map((item) => (
              <button
                key={item.key}
                onClick={() => onFilterByMissing?.(item.key)}
                className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
              >
                {item.label}: {item.count}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
