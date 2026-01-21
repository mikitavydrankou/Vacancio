import { useState, useEffect } from "react"
import { saveToStorage, loadFromStorage } from "@/lib/utils/storage"

export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [isMounted, setIsMounted] = useState(false)
    const [value, setValue] = useState<T>(defaultValue)

    // Load from storage on mount
    useEffect(() => {
        setIsMounted(true)
        const savedValue = loadFromStorage(key, defaultValue)
        setValue(savedValue)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Save to storage when value changes
    useEffect(() => {
        if (!isMounted) return
        saveToStorage(key, value)
    }, [key, value, isMounted])

    return [value, setValue]
}
