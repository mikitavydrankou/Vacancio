import type { Resume, JobApplication, ResumeProfile } from "./types"

const RESUMES_KEY = "vacancio-resumes"
const APPLICATIONS_KEY = "vacancio-applications"
const PROFILES_KEY = "vacancio-profiles"

export function getProfiles(): ResumeProfile[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(PROFILES_KEY)
  if (!data) return []
  return JSON.parse(data).map((p: ResumeProfile) => ({
    ...p,
    createdAt: new Date(p.createdAt),
  }))
}

export function saveProfile(profile: ResumeProfile): void {
  if (typeof window === "undefined") return
  const profiles = getProfiles()
  const existing = profiles.findIndex((p) => p.id === profile.id)
  if (existing >= 0) {
    profiles[existing] = profile
  } else {
    profiles.push(profile)
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return
  const profiles = getProfiles().filter((p) => p.id !== id)
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))

  // Also delete associated resumes? Or just keep them orphaned?
  // Ideally delete them.
  const resumes = getResumes().filter(r => r.profileId !== id)
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
}

export function getResumes(profileId?: string): Resume[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(RESUMES_KEY)
  if (!data) return []
  let resumes = JSON.parse(data).map((r: Resume) => ({
    ...r,
    uploadedAt: new Date(r.uploadedAt),
  }))

  if (profileId) {
    resumes = resumes.filter((r: Resume) => r.profileId === profileId)
  }
  return resumes
}

export function saveResume(resume: Resume): void {
  if (typeof window === "undefined") return
  // We don't filter by profileId to save, we read all, update one, save all
  const data = localStorage.getItem(RESUMES_KEY)
  const resumes = data ? JSON.parse(data) : []

  const existingIndex = resumes.findIndex((r: Resume) => r.id === resume.id)
  if (existingIndex >= 0) {
    resumes[existingIndex] = resume
  } else {
    resumes.push(resume)
  }
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
}

export function deleteResume(id: string): void {
  if (typeof window === "undefined") return
  // Read raw to delete
  const data = localStorage.getItem(RESUMES_KEY)
  if (!data) return
  const resumes = JSON.parse(data).filter((r: Resume) => r.id !== id)
  localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
}

export function getApplications(profileId?: string): JobApplication[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(APPLICATIONS_KEY)
  if (!data) return []
  let apps = JSON.parse(data).map((a: JobApplication) => ({
    ...a,
    appliedAt: new Date(a.appliedAt),
    respondedAt: a.respondedAt ? new Date(a.respondedAt) : undefined,
    interviewDate: a.interviewDate ? new Date(a.interviewDate) : undefined,
    rejectedAt: a.rejectedAt ? new Date(a.rejectedAt) : undefined,
  }))

  if (profileId) {
    apps = apps.filter((a: JobApplication) => a.profileId === profileId)
  }
  return apps
}

export function saveApplication(app: JobApplication): void {
  if (typeof window === "undefined") return
  const apps = getApplications() // This gets ALL if no profileId passed, but wait, getApplications returns ALL by default
  // My getApplications impl above checks profileId. 
  // Calling getApplications without args returns all. Correct.

  const existing = apps.findIndex((a) => a.id === app.id)
  if (existing >= 0) {
    apps[existing] = app
  } else {
    apps.push(app)
  }
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps))
}

export function deleteApplication(id: string): void {
  if (typeof window === "undefined") return
  const apps = getApplications().filter((a) => a.id !== id)
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps))
}

export function getActiveResume(profileId?: string): Resume | null {
  const resumes = getResumes(profileId)
  if (resumes.length === 0) return null
  return resumes.reduce((latest, current) => (current.version > latest.version ? current : latest))
}

export function getNextResumeVersion(profileId: string): number {
  const resumes = getResumes(profileId)
  if (resumes.length === 0) return 1
  return Math.max(...resumes.map((r) => r.version)) + 1
}

// Migration Helper
export function ensureDefaultProfile(): ResumeProfile {
  const profiles = getProfiles()
  if (profiles.length > 0) return profiles[0]

  const defaultProfile: ResumeProfile = {
    id: "default",
    name: "Default Profile",
    createdAt: new Date()
  }
  saveProfile(defaultProfile)

  // Migrate existing resumes/apps without profileId
  const resumes = getResumes()
  let resumesChanged = false
  resumes.forEach(r => {
    if (!r.profileId) {
      r.profileId = defaultProfile.id
      resumesChanged = true
    }
  })
  if (resumesChanged && typeof window !== "undefined") {
    localStorage.setItem(RESUMES_KEY, JSON.stringify(resumes))
  }

  const apps = getApplications()
  let appsChanged = false
  apps.forEach(a => {
    if (!a.profileId) {
      a.profileId = defaultProfile.id
      appsChanged = true
    }
  })
  if (appsChanged && typeof window !== "undefined") {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps))
  }

  return defaultProfile
}
