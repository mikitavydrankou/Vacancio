import type { ApplicationStatus, JobSource } from "@/lib/types"

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
    parsing: { label: "Parsing...", color: "bg-amber-500/10 text-amber-600 border-amber-500/60 animate-pulse ring-1 ring-amber-500/30 font-semibold" },
    no_response: { label: "No Response", color: "bg-zinc-500/20 text-zinc-400" },
    screening: { label: "Screening", color: "bg-blue-500/20 text-blue-400" },
    interview: { label: "Interview", color: "bg-amber-500/20 text-amber-400" },
    offer: { label: "Offer", color: "bg-green-500/20 text-green-400" },
    rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
    failed: { label: "Error", color: "bg-red-500/20 text-red-400 border-red-500/50" },
}

export const STATUSES: ApplicationStatus[] = [
    "no_response",
    "screening",
    "interview",
    "offer",
    "rejected",
    "failed",
]


export const SOURCES: JobSource[] = ["pracuj", "nofluffjobs", "justjoin", "indeed", "linkedin", "other"]

export const STORAGE_KEY = "vacancio-state"
