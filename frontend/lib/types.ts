export interface Resume {
  id: string
  profileId: string
  name: string
  version: number
  uploadedAt: Date
  filePath?: string
  fileData?: string // base64 for PDF
  fileName?: string
}

export interface ResumeProfile {
  id: string
  name: string
  createdAt: Date
}

export interface JobApplication {
  id: string
  profileId: string
  resumeId: string
  resumeVersion: number
  url: string
  company: string
  position: string
  location?: string
  salary?: string
  techStack: string[]
  niceToHaveStack?: string[]
  responsibilities: string[]
  requirements?: string[]
  description?: string
  workMode?: string
  employmentType?: string
  appliedAt: Date
  status: ApplicationStatus
  isFavorite: boolean
  isArchived: boolean
  responded: boolean
  respondedAt?: Date
  interviewScheduled: boolean
  interviewDate?: Date
  interviewNotes?: string
  interviewRecordingUrl?: string
  offerReceived: boolean
  offerAmount?: string
  rejected: boolean
  rejectedAt?: Date
  notes?: string
  source: JobSource
  rawData?: string
}

export type ApplicationStatus =
  | "parsing"
  | "no_response"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"

export type JobSource = "pracuj" | "nofluffjobs" | "justjoin" | "indeed" | "linkedin" | "other"

export interface ParsedJobData {
  company: string
  position: string
  location?: string
  salary?: string
  techStack: string[]
  niceToHaveStack?: string[]
  responsibilities: string[]
  requirements?: string[]
  description?: string
  workMode?: string
  employmentType?: string
  source: JobSource
  rawData?: string
}
