"use client"

import { useState } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type DatePreset = 
  | "today"
  | "yesterday"
  | "last_7d"
  | "last_14d"
  | "last_30d"
  | "last_90d"
  | "this_month"
  | "last_month"
  | "lifetime"

interface DateRangeSelectorProps {
  value: DatePreset
  onChange: (value: DatePreset) => void
}

const datePresets = [
  { value: "today" as DatePreset, label: "Today" },
  { value: "yesterday" as DatePreset, label: "Yesterday" },
  { value: "last_7d" as DatePreset, label: "Last 7 days" },
  { value: "last_14d" as DatePreset, label: "Last 14 days" },
  { value: "last_30d" as DatePreset, label: "Last 30 days" },
  { value: "last_90d" as DatePreset, label: "Last 90 days" },
  { value: "this_month" as DatePreset, label: "This month" },
  { value: "last_month" as DatePreset, label: "Last month" },
  { value: "lifetime" as DatePreset, label: "Lifetime" },
]

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const currentPreset = datePresets.find(p => p.value === value) || datePresets[2]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[180px] justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{currentPreset.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {datePresets.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => onChange(preset.value)}
            className={preset.value === value ? "bg-accent" : ""}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}