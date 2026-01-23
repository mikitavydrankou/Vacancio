/**
 * Formats a date into a human-readable relative time string
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Today", "2d ago", "Jan 15")
 */
export const formatDate = (date: Date): string => {
    const now = new Date()
    const appDate = new Date(date)
    const diff = now.getTime() - appDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    if (days < 365)
        return appDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    return appDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

/**
 * Ensures a URL has a protocol (http/https)
 * @param url - The URL to process
 * @returns URL with protocol
 */
export const ensureAbsoluteUrl = (url: string): string => {
    if (!url) return ""
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    return `https://${url}`
}

/**
 * Formats currency amount
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: string): string => {
    if (!amount) return ""
    // Add currency formatting logic as needed
    return amount
}
