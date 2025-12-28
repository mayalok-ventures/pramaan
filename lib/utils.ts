/**
 * Utility Functions
 * Common utilities for the application
 * @utils
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes efficiently
 * @param inputs Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format date to human-readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
        return 'Today'
    } else if (diffDays === 1) {
        return 'Yesterday'
    } else if (diffDays < 7) {
        return `${diffDays} days ago`
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7)
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    } else {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

/**
 * Generate random ID
 * @param prefix Optional prefix for ID
 * @returns Random ID string
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function for performance optimization
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout

    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Validate email address
 * @param email Email to validate
 * @returns boolean indicating validity
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Calculate percentage
 * @param value Current value
 * @param total Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
}

/**
 * Safe JSON parse with error handling
 * @param str JSON string to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T>(str: string, defaultValue: T): T {
    try {
        return JSON.parse(str) as T
    } catch {
        return defaultValue
    }
}

/**
 * Generate array of numbers for pagination
 * @param currentPage Current page number
 * @param totalPages Total number of pages
 * @returns Array of page numbers to display
 */
export function generatePagination(currentPage: number, totalPages: number): number[] {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            range.push(i)
        }
    }

    let prev = 0
    for (const i of range) {
        if (prev) {
            if (i - prev === 2) {
                rangeWithDots.push(prev + 1)
            } else if (i - prev !== 1) {
                rangeWithDots.push('...')
            }
        }
        rangeWithDots.push(i)
        prev = i
    }

    return rangeWithDots.filter(n => typeof n === 'number') as number[]
}

/**
 * Convert object to URL query string
 * @param params Object to convert
 * @returns URL query string
 */
export function objectToQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
                value.forEach(v => searchParams.append(key, v.toString()))
            } else {
                searchParams.append(key, value.toString())
            }
        }
    })

    return searchParams.toString()
}