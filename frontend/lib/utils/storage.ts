import { STORAGE_KEY } from "@/lib/constants/application"

export const saveToStorage = (key: string, value: any) => {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(value))
    } catch (e) {
        console.error("Failed to save to localStorage", e)
    }
}

export const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue
    try {
        const item = localStorage.getItem(`${STORAGE_KEY}-${key}`)
        return item ? JSON.parse(item) : defaultValue
    } catch (e) {
        console.error("Failed to load from localStorage", e)
        return defaultValue
    }
}
