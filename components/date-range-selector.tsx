"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export type DateRangePreset = "last_7d" | "last_30d" | "last_90d" | "last_365d"

interface DateRangeSelectorProps {
  selectedRange: DateRangePreset
  onRangeChange: (value: DateRangePreset) => void
  disabled?: boolean
}

const dateRangeOptions: { label: string; value: DateRangePreset }[] = [
  { label: "Last 7 Days", value: "last_7d" },
  { label: "Last 30 Days", value: "last_30d" },
  { label: "Last 90 Days", value: "last_90d" },
  { label: "Last 365 Days", value: "last_365d" },
]

export function DateRangeSelector({ selectedRange, onRangeChange, disabled }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="date-range-select" className="text-sm text-gray-300 whitespace-nowrap">
        Date Range:
      </Label>
      <Select
        value={selectedRange}
        onValueChange={(value) => onRangeChange(value as DateRangePreset)}
        disabled={disabled}
      >
        <SelectTrigger
          id="date-range-select"
          className="w-[180px] text-sm bg-gray-700 border-gray-600 hover:border-gray-500 focus:ring-blue-500 text-white"
        >
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {dateRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="hover:bg-gray-700 focus:bg-gray-600">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
