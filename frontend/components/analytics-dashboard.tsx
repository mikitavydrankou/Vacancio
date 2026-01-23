"use client"

import type { JobApplication, Resume, JobSource } from "@/lib/types"
import { Send, MessageSquare, Calendar, Trophy, AlertCircle, Globe } from "lucide-react"
import { getSourceLabel } from "@/lib/job-parser"
import {
  calculateResponseStats,
  calculateSourceStats,
  calculateMissingFieldsStats,
  calculateIncompleteApps,
} from "@/lib/utils/statistics"

interface AnalyticsDashboardProps {
  applications: JobApplication[]
  resumes: Resume[]
  onFilterByMissing?: (field: string) => void
}

export function AnalyticsDashboard({ applications, resumes, onFilterByMissing }: AnalyticsDashboardProps) {
  const { totalApplied, responded, interviews, offers, responseRate, interviewRate } =
    calculateResponseStats(applications)
  const sourceStats = calculateSourceStats(applications)
  const sortedSources = Array.from(sourceStats.entries()).sort((a, b) => b[1] - a[1])
  const missingFieldsStats = calculateMissingFieldsStats(applications)
  const totalIncomplete = calculateIncompleteApps(applications)

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
