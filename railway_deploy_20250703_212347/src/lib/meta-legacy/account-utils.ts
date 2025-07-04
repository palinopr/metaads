/**
 * Utility functions for handling Meta account IDs
 * 
 * Meta account IDs have two formats:
 * 1. Storage format: Numeric string without prefix (e.g., "123456789")
 * 2. API format: Numeric string with act_ prefix (e.g., "act_123456789")
 */

/**
 * Formats a Meta account ID for API calls by ensuring it has the act_ prefix
 * @param accountId - The account ID (with or without act_ prefix)
 * @returns The account ID with act_ prefix
 */
export function formatMetaAccountId(accountId: string): string {
  if (!accountId) {
    throw new Error('Account ID is required')
  }
  
  // Remove any existing act_ prefix and re-add it
  const numericId = accountId.replace(/^act_/, '')
  return `act_${numericId}`
}

/**
 * Parses a Meta account ID for storage by removing the act_ prefix
 * @param accountId - The account ID (with or without act_ prefix)
 * @returns The numeric account ID without prefix
 */
export function parseMetaAccountId(accountId: string): string {
  if (!accountId) {
    throw new Error('Account ID is required')
  }
  
  // Remove act_ prefix if present
  return accountId.replace(/^act_/, '')
}

/**
 * Validates if a string is a valid Meta account ID
 * @param accountId - The account ID to validate
 * @returns True if valid, false otherwise
 */
export function isValidMetaAccountId(accountId: string): boolean {
  if (!accountId) {
    return false
  }
  
  // Must be numeric string (after removing act_ if present)
  const numericId = parseMetaAccountId(accountId)
  return /^\d+$/.test(numericId)
}

/**
 * Checks if an ID is a UUID (internal ID) vs Meta account ID
 * @param id - The ID to check
 * @returns True if UUID, false if Meta account ID
 */
export function isInternalUUID(id: string): boolean {
  if (!id) {
    return false
  }
  
  // UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Gets a display-friendly version of the account ID
 * @param accountId - The account ID
 * @returns Formatted string for display
 */
export function getDisplayAccountId(accountId: string): string {
  if (!accountId) {
    return 'Unknown'
  }
  
  const numericId = parseMetaAccountId(accountId)
  return `act_${numericId}`
}