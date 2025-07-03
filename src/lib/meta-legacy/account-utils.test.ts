import { describe, test, expect } from '@jest/globals'
import {
  formatMetaAccountId,
  parseMetaAccountId,
  isValidMetaAccountId,
  isInternalUUID,
  getDisplayAccountId
} from './account-utils'

describe('Meta Account ID Utils', () => {
  describe('formatMetaAccountId', () => {
    test('adds act_ prefix to numeric ID', () => {
      expect(formatMetaAccountId('123456789')).toBe('act_123456789')
    })
    
    test('handles ID that already has act_ prefix', () => {
      expect(formatMetaAccountId('act_123456789')).toBe('act_123456789')
    })
    
    test('throws error for empty ID', () => {
      expect(() => formatMetaAccountId('')).toThrow('Account ID is required')
    })
  })
  
  describe('parseMetaAccountId', () => {
    test('removes act_ prefix', () => {
      expect(parseMetaAccountId('act_123456789')).toBe('123456789')
    })
    
    test('handles ID without prefix', () => {
      expect(parseMetaAccountId('123456789')).toBe('123456789')
    })
    
    test('throws error for empty ID', () => {
      expect(() => parseMetaAccountId('')).toThrow('Account ID is required')
    })
  })
  
  describe('isValidMetaAccountId', () => {
    test('validates numeric ID', () => {
      expect(isValidMetaAccountId('123456789')).toBe(true)
    })
    
    test('validates ID with act_ prefix', () => {
      expect(isValidMetaAccountId('act_123456789')).toBe(true)
    })
    
    test('rejects non-numeric ID', () => {
      expect(isValidMetaAccountId('invalid-id')).toBe(false)
      expect(isValidMetaAccountId('abc123')).toBe(false)
      expect(isValidMetaAccountId('123abc')).toBe(false)
    })
    
    test('rejects UUID', () => {
      expect(isValidMetaAccountId('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
    })
    
    test('rejects empty ID', () => {
      expect(isValidMetaAccountId('')).toBe(false)
    })
  })
  
  describe('isInternalUUID', () => {
    test('identifies valid UUID v4', () => {
      expect(isInternalUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isInternalUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false) // v1
    })
    
    test('rejects Meta account IDs', () => {
      expect(isInternalUUID('123456789')).toBe(false)
      expect(isInternalUUID('act_123456789')).toBe(false)
    })
    
    test('rejects invalid formats', () => {
      expect(isInternalUUID('not-a-uuid')).toBe(false)
      expect(isInternalUUID('')).toBe(false)
    })
  })
  
  describe('getDisplayAccountId', () => {
    test('formats numeric ID for display', () => {
      expect(getDisplayAccountId('123456789')).toBe('act_123456789')
    })
    
    test('handles ID with prefix', () => {
      expect(getDisplayAccountId('act_123456789')).toBe('act_123456789')
    })
    
    test('returns Unknown for empty ID', () => {
      expect(getDisplayAccountId('')).toBe('Unknown')
    })
  })
})