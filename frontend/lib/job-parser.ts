import type { ParsedJobData, JobSource } from "./types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export function detectJobSource(url: string): JobSource {
  try {
    const hostname = new URL(url).hostname.toLowerCase()

    if (hostname.includes("pracuj.pl")) return "pracuj"
    if (hostname.includes("nofluffjobs.com")) return "nofluffjobs"
    if (hostname.includes("justjoin.it")) return "justjoin"
    if (hostname.includes("indeed.")) return "indeed"
    if (hostname.includes("linkedin.com")) return "linkedin"

    return "other"
  } catch {
    return "other"
  }
}

export function detectJobSourceFromText(text: string): JobSource {
  const lowerText = text.toLowerCase()

  // LinkedIn indicators
  if (
    lowerText.includes("linkedin") ||
    lowerText.includes("easy apply") ||
    lowerText.includes("reactivate premium") ||
    lowerText.includes("on linkedin") ||
    /\d+\s+followers/.test(lowerText)
  ) {
    return "linkedin"
  }

  // Pracuj.pl indicators
  if (lowerText.includes("pracuj.pl") || lowerText.includes("grupa pracuj")) {
    return "pracuj"
  }

  // NoFluffJobs indicators
  if (lowerText.includes("nofluffjobs") || lowerText.includes("no fluff jobs")) {
    return "nofluffjobs"
  }

  // JustJoin.it indicators
  if (lowerText.includes("justjoin") || lowerText.includes("just join it")) {
    return "justjoin"
  }

  // Indeed indicators
  if (lowerText.includes("indeed.com") || lowerText.includes("apply on indeed")) {
    return "indeed"
  }

  return "other"
}

interface BackendSalary {
  min?: number
  max?: number
  currency?: string
  unit?: string
  gross_net?: string
}

interface BackendJobPosting {
  job_title?: string
  company?: string
  location?: string
  work_mode?: string
  employment_type?: string
  salary?: BackendSalary
  stack: string[]
  nice_to_have_stack: string[]
  requirements: string[]
  responsibilities: string[]
  project_description?: string
  source?: string
  raw_data?: string
}

function formatSalary(salary?: BackendSalary): string | undefined {
  if (!salary || (!salary.min && !salary.max)) return undefined

  const parts: string[] = []
  if (salary.min && salary.max) {
    parts.push(`${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`)
  } else if (salary.min) {
    parts.push(`${salary.min.toLocaleString()}+`)
  } else if (salary.max) {
    parts.push(`up to ${salary.max.toLocaleString()}`)
  }

  if (salary.currency) parts.push(salary.currency)
  if (salary.gross_net && salary.gross_net !== "unknown") parts.push(`(${salary.gross_net})`)

  return parts.join(" ")
}

function mapBackendToFrontend(data: BackendJobPosting, source: JobSource): ParsedJobData {
  return {
    company: data.company || "",
    position: data.job_title || "",
    location: data.location,
    salary: formatSalary(data.salary),
    techStack: data.stack || [],
    niceToHaveStack: data.nice_to_have_stack || [],
    responsibilities: data.responsibilities || [],
    requirements: data.requirements || [],
    description: data.project_description,
    workMode: data.work_mode,
    employmentType: data.employment_type,
    source,
    rawData: data.raw_data,
  }
}



export async function parseJobText(text: string, manualSource?: JobSource): Promise<ParsedJobData> {
  try {
    const response = await fetch(`${BACKEND_URL}/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, model: "openai/gpt-4o-mini" }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Backend error:", error)
      throw new Error("Failed to parse text")
    }

    const data: BackendJobPosting = await response.json()
    // Use manual source if provided, otherwise try to detect from text
    const detectedSource = manualSource || detectJobSourceFromText(text)
    return mapBackendToFrontend(data, detectedSource)
  } catch (error) {
    console.error("Parse text error:", error)
    throw error
  }
}

export function getSourceLabel(source: JobSource): string {
  const labels: Record<JobSource, string> = {
    pracuj: "Pracuj.pl",
    nofluffjobs: "NoFluffJobs",
    justjoin: "JustJoin.it",
    indeed: "Indeed",
    linkedin: "LinkedIn",
    other: "Other",
  }
  return labels[source]
}

export function getSourceColor(source: JobSource): string {
  const colors: Record<JobSource, string> = {
    pracuj: "bg-blue-500/20 text-blue-400",
    nofluffjobs: "bg-green-500/20 text-green-400",
    justjoin: "bg-amber-500/20 text-amber-400",
    indeed: "bg-indigo-500/20 text-indigo-400",
    linkedin: "bg-sky-500/20 text-sky-400",
    other: "bg-muted text-muted-foreground",
  }
  return colors[source]
}
