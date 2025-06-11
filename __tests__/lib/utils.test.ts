import { cn, formatNumberWithCommas, formatCurrency, formatPercentage } from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-2 py-1', 'bg-red hover:bg-dark-red')).toBe('px-2 py-1 bg-red hover:bg-dark-red')
    })

    it('should handle conditional classes', () => {
      expect(cn('px-2', false && 'py-1', 'bg-red')).toBe('px-2 bg-red')
    })

    it('should handle conflicting Tailwind classes', () => {
      expect(cn('px-2 px-4')).toBe('px-4')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatNumberWithCommas', () => {
    it('should format numbers with commas', () => {
      expect(formatNumberWithCommas(1000)).toBe('1,000')
      expect(formatNumberWithCommas(1234567)).toBe('1,234,567')
    })

    it('should handle decimals', () => {
      expect(formatNumberWithCommas(1000.123, 2)).toBe('1,000.12')
      expect(formatNumberWithCommas(1234.5, 1)).toBe('1,234.5')
    })

    it('should handle string inputs', () => {
      expect(formatNumberWithCommas('1000')).toBe('1,000')
      expect(formatNumberWithCommas('1234.567', 2)).toBe('1,234.57')
    })

    it('should handle invalid inputs', () => {
      expect(formatNumberWithCommas(undefined)).toBe('-')
      expect(formatNumberWithCommas(null)).toBe('-')
      expect(formatNumberWithCommas('')).toBe('-')
      expect(formatNumberWithCommas('invalid')).toBe('-')
    })

    it('should handle zero', () => {
      expect(formatNumberWithCommas(0)).toBe('0')
      expect(formatNumberWithCommas('0')).toBe('0')
    })
  })

  describe('formatCurrency', () => {
    it('should format numbers as currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('should handle string inputs', () => {
      expect(formatCurrency('1000')).toBe('$1,000.00')
      expect(formatCurrency('1234.567')).toBe('$1,234.57')
    })

    it('should handle invalid inputs', () => {
      expect(formatCurrency(undefined)).toBe('-')
      expect(formatCurrency(null)).toBe('-')
      expect(formatCurrency('')).toBe('-')
      expect(formatCurrency('invalid')).toBe('-')
    })

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(-1000)).toBe('-$1,000.00')
    })
  })

  describe('formatPercentage', () => {
    it('should format numbers as percentage', () => {
      expect(formatPercentage(0.5)).toBe('0.50%')
      expect(formatPercentage(1.234)).toBe('1.23%')
    })

    it('should handle multiplyBy100 option', () => {
      expect(formatPercentage(0.5, true)).toBe('50.00%')
      expect(formatPercentage(1.234, true)).toBe('123.40%')
    })

    it('should handle string inputs', () => {
      expect(formatPercentage('0.5')).toBe('0.50%')
      expect(formatPercentage('1.234', true)).toBe('123.40%')
    })

    it('should handle invalid inputs', () => {
      expect(formatPercentage(undefined)).toBe('-')
      expect(formatPercentage(null)).toBe('-')
      expect(formatPercentage('')).toBe('-')
      expect(formatPercentage('invalid')).toBe('-')
    })

    it('should handle zero and negative values', () => {
      expect(formatPercentage(0)).toBe('0.00%')
      expect(formatPercentage(-0.5)).toBe('-0.50%')
      expect(formatPercentage(-0.5, true)).toBe('-50.00%')
    })
  })
})