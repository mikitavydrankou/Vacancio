"use client"

import type { JobApplication, Resume, JobSource } from "@/lib/types"
import { Send, MessageSquare, Calendar, Trophy, AlertCircle, Globe } from "lucide-react"
import { getSourceLabel } from "@/lib/job-parser"
import { cn } from "@/lib/utils"
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

type Accent = "default" | "cyan" | "amber" | "green"

const ACCENT: Record<Accent, string> = {
  default: "text-foreground",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  green: "text-green-400",
}

function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  accent = "default",
}: {
  icon: typeof Send
  value: string | number
  label: string
  sub?: string
  accent?: Accent
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-background/40 p-3">
      <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", ACCENT[accent])} />
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("text-2xl font-bold leading-none", ACCENT[accent])}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  )
}

export function AnalyticsDashboard({ applications, onFilterByMissing }: AnalyticsDashboardProps) {
  const { totalApplied, responded, interviews, offers, responseRate } =
    calculateResponseStats(applications)
  const sourceStats = calculateSourceStats(applications)
  const sortedSources = Array.from(sourceStats.entries()).sort((a, b) => b[1] - a[1])
  const missingFieldsStats = calculateMissingFieldsStats(applications)
  const totalIncomplete = calculateIncompleteApps(applications)

  const missingItems = [
    { key: "description", label: "Description", count: missingFieldsStats.description },
    { key: "requirements", label: "Requirements", count: missingFieldsStats.requirements },
    { key: "responsibilities", label: "Responsibilities", count: missingFieldsStats.responsibilities },
    { key: "techStack", label: "Tech stack", count: missingFieldsStats.techStack },
  ].filter((item) => item.count > 0)

  return (
    <div className="space-y-4">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Send} value={totalApplied} label="Applied" />
        <StatTile icon={MessageSquare} value={`${responseRate}%`} label="Response rate" sub={`${responded} replied`} accent="cyan" />
        <StatTile icon={Calendar} value={interviews} label="Interviews" accent="amber" />
        <StatTile icon={Trophy} value={offers} label="Offers" accent="green" />
      </div>

      {/* Secondary rows */}
      {(sortedSources.length > 0 || totalIncomplete > 0) && (
        <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-8">
          {sortedSources.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> Sources
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sortedSources.map(([source, count]) => (
                  <span key={source} className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                    {getSourceLabel(source as JobSource)} <span className="opacity-60">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {missingItems.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-amber-500">
                <AlertCircle className="h-3.5 w-3.5" /> Needs attention
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => onFilterByMissing?.(item.key)}
                    className="rounded-md bg-amber-500/10 px-2 py-0.5 text-amber-400 transition-colors hover:bg-amber-500/20"
                    title={`Show applications missing ${item.label.toLowerCase()}`}
                  >
                    {item.label} <span className="opacity-70">{item.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
