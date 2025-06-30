"use client"

import { createContext, useContext, useState, ReactNode } from 'react'
import { DatePreset } from '@/components/date-range-selector'

interface DateRangeContextType {
  dateRange: DatePreset
  setDateRange: (value: DatePreset) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DatePreset>('last_30d')

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  return context
}