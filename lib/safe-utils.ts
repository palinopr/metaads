/**
 * Safe utility functions to prevent common runtime errors
 * These functions handle undefined/null values gracefully
 */

/**
 * Safely convert a number to fixed decimal places
 * @param value - The number to convert (can be undefined/null)
 * @param decimals - Number of decimal places (default 2)
 * @param fallback - Fallback value if input is invalid (default 0)
 * @returns Formatted string with fixed decimals
 */
export function safeToFixed(
  value: number | undefined | null,
  decimals: number = 2,
  fallback: number = 0
): string {
  const num = value ?? fallback
  return Number(num).toFixed(decimals)
}

/**
 * Safely access nested object properties
 * @param obj - The object to access
 * @param path - Path to the property (e.g., 'user.profile.name')
 * @param fallback - Fallback value if property doesn't exist
 * @returns The value at the path or fallback
 */
export function safeGet<T = any>(
  obj: any,
  path: string,
  fallback: T | null = null
): T {
  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result == null) return fallback as T
    result = result[key]
  }

  return result ?? fallback
}

/**
 * Safely parse a number from various inputs
 * @param value - The value to parse (string, number, undefined, null)
 * @param fallback - Fallback value if parsing fails (default 0)
 * @returns Parsed number or fallback
 */
export function safeParseNumber(
  value: string | number | undefined | null,
  fallback: number = 0
): number {
  if (value == null) return fallback
  const parsed = Number(value)
  return isNaN(parsed) ? fallback : parsed
}

/**
 * Safely format currency values
 * @param value - The value to format
 * @param fallback - Fallback if value is invalid
 * @returns Formatted currency string
 */
export function safeCurrency(
  value: number | undefined | null,
  fallback: string = '$0.00'
): string {
  if (value == null) return fallback
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

/**
 * Safely access array index
 * @param arr - The array to access
 * @param index - The index to access
 * @param fallback - Fallback value if index doesn't exist
 * @returns Value at index or fallback
 */
export function safeArrayAccess<T>(
  arr: T[] | undefined | null,
  index: number,
  fallback: T | null = null
): T | null {
  if (!Array.isArray(arr)) return fallback
  return arr[index] ?? fallback
}

/**
 * Type guard to check if value is defined
 * @param value - Value to check
 * @returns True if value is not null or undefined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * Type guard to check if value is a valid number
 * @param value - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Safely chain function calls with error handling
 * @param fn - Function to execute
 * @param fallback - Fallback value if function throws
 * @returns Function result or fallback
 */
export function safeTry<T>(
  fn: () => T,
  fallback: T | null = null
): T | null {
  try {
    return fn()
  } catch (error) {
    console.warn('safeTry caught error:', error)
    return fallback
  }
}

/**
 * Create a safe wrapper for any function
 * @param fn - Function to wrap
 * @param fallback - Fallback value if function throws
 * @returns Wrapped function that won't throw
 */
export function createSafeFunction<T extends (...args: any[]) => any>(
  fn: T,
  fallback: ReturnType<T> | null = null
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args)
    } catch (error) {
      console.warn('Safe function caught error:', error)
      return fallback
    }
  }) as T
}