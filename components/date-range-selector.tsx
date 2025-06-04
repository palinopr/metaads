"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface DateRangeSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean // Added disabled prop
}

export function DateRangeSelector({ value, onChange, disabled }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-400" />
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          <SelectItem value="today" className="hover:bg-gray-700 focus:bg-gray-600">
            Today
          </SelectItem>
          <SelectItem value="last_7d" className="hover:bg-gray-700 focus:bg-gray-600">
            Last 7 Days
          </SelectItem>
          <SelectItem value="last_30d" className="hover:bg-gray-700 focus:bg-gray-600">
            Last 30 Days
          </SelectItem>
          <SelectItem value="last_90d" className="hover:bg-gray-700 focus:bg-gray-600">
            Last 90 Days
          </SelectItem>
          <SelectItem value="lifetime" className="hover:bg-gray-700 focus:bg-gray-600">
            Lifetime
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
