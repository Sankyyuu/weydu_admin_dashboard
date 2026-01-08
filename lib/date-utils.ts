/**
 * Utility functions for date formatting with Europe/Paris timezone
 */

const PARIS_TIMEZONE = 'Europe/Paris'

/**
 * Formats a date string or Date object to a localized date string in Europe/Paris timezone
 */
export function formatDateInParis(
  date: string | Date,
  locale: string = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Use Intl.DateTimeFormat to ensure Europe/Paris timezone
  return new Intl.DateTimeFormat(locale, {
    timeZone: PARIS_TIMEZONE,
    ...options,
  }).format(dateObj)
}

/**
 * Formats a date string or Date object to a localized time string in Europe/Paris timezone
 */
export function formatTimeInParis(
  date: string | Date,
  locale: string = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat(locale, {
    timeZone: PARIS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(dateObj)
}

/**
 * Formats a date string or Date object to a localized date and time string in Europe/Paris timezone
 */
export function formatDateTimeInParis(
  date: string | Date,
  locale: string = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat(locale, {
    timeZone: PARIS_TIMEZONE,
    ...options,
  }).format(dateObj)
}

