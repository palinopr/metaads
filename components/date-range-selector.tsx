"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface DateRangeSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean // Added disabled prop
}

export function DateRangeSelector({ value, onChange, disabled }: DateRangeSelectorProps) {
  const dateRanges = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last_7d" },
    { label: "Last 14 Days", value: "last_14d" },
    { label: "Last 30 Days", value: "last_30d" },
    { label: "Last 90 Days", value: "last_90d" },
    { label: "Lifetime", value: "lifetime" },
  ]

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-[110px] md:w-40 text-xs md:text-sm bg-gray-800 border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder="Select Range" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {dateRanges.map((range) => (
            <SelectItem
              key={range.value}
              value={range.value}
              className="text-xs md:text-sm hover:bg-gray-700 focus:bg-gray-600"
            >
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
