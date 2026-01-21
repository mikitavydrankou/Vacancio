import { useState, useEffect, useRef } from "react"
import type { Resume, JobApplication, ApplicationStatus, ResumeProfile } from "@/lib/types"
import {
    fetchProfiles,
    fetchResumes,
    fetchApplications,
    createApplication,
    updateApplicationStatus,
    deleteApplication,
    toggleFavorite,
    toggleArchive
} from "@/lib/api"
import { loadFromStorage } from "@/lib/utils/storage"

export function useApplicationData() {
    const [profiles, setProfiles] = useState<ResumeProfile[]>([])
    const [resumes, setResumes] = useState<Resume[]>([])
    const [applications, setApplications] = useState<JobApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const isMounted = useRef(false)

    useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    const loadAllData = async () => {
        if (!isMounted.current) return { profData: [], resumeData: [], appData: [] }
        setIsLoading(true)
        try {
            const [profData, resumeData, appData] = await Promise.all([
                fetchProfiles(),
                fetchResumes(),
                fetchApplications()
            ])

            if (isMounted.current) {
                setProfiles(profData)
                setResumes(resumeData)
                setApplications(appData)
            }

            return { profData, resumeData, appData }
        } catch (error) {
            console.error("Failed to load data", error)
            return { profData: [], resumeData: [], appData: [] }
        } finally {
            if (isMounted.current) {
                setIsLoading(false)
            }
        }
    }

    const refreshData = async () => {
        // Light refresh
        const [resumeData, appData] = await Promise.all([
            fetchResumes(),
            fetchApplications()
        ])
        if (isMounted.current) {
            setResumes(resumeData)
            setApplications(appData)
        }
    }

    // Polling for parsing status
    useEffect(() => {
        const hasParsingApps = applications.some(app => app.status === "parsing")
        if (!hasParsingApps) return

        const intervalId = setInterval(async () => {
            const appData = await fetchApplications()
            if (isMounted.current) {
                setApplications(appData)
            }
        }, 3000)

        return () => clearInterval(intervalId)
    }, [applications])

    // Load data on mount
    useEffect(() => {
        loadAllData()
    }, [])

    const handleStatusChange = async (app: JobApplication, newStatus: ApplicationStatus) => {
        // optimistic update
        const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: newStatus } : a)
        setApplications(updatedApps)

        try {
            await updateApplicationStatus(app.id, newStatus)
        } catch {
            // revert on fail
            if (isMounted.current) {
                setApplications(applications)
                alert("Failed to update status")
            }
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteApplication(id)
            if (isMounted.current) {
                setApplications(applications.filter(a => a.id !== id))
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleToggleFavorite = async (app: JobApplication) => {
        const newValue = !app.isFavorite
        // optimistic update
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isFavorite: newValue } : a))
        try {
            await toggleFavorite(app.id, newValue)
        } catch {
            // revert on fail
            if (isMounted.current) {
                setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isFavorite: !newValue } : a))
            }
        }
    }

    const handleToggleArchive = async (app: JobApplication) => {
        const newValue = !app.isArchived
        // optimistic update
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isArchived: newValue } : a))
        try {
            await toggleArchive(app.id, newValue)
        } catch {
            // revert on fail
            if (isMounted.current) {
                setApplications(prev => prev.map(a => a.id === app.id ? { ...a, isArchived: !newValue } : a))
            }
        }
    }

    const handleCreateApplication = async (app: Partial<JobApplication>) => {
        await createApplication(app)
        await refreshData()
    }

    return {
        profiles,
        resumes,
        applications,
        isLoading,
        setProfiles,
        setResumes,
        setApplications,
        loadAllData,
        refreshData,
        handleStatusChange,
        handleDelete,
        handleToggleFavorite,
        handleToggleArchive,
        handleCreateApplication,
    }
}
