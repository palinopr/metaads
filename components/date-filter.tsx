"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DateFilterProps {
  selected: 'today' | 'yesterday' | 'all'
  onSelect: (filter: 'today' | 'yesterday' | 'all') => void
  className?: string
}

export function DateFilter({ selected, onSelect, className }: DateFilterProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-muted rounded-md", className)}>
      <Button
        variant={selected === 'today' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('today')}
        className="h-8"
      >
        <Calendar className="h-4 w-4 mr-1" />
        Today
      </Button>
      
      <Button
        variant={selected === 'yesterday' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('yesterday')}
        className="h-8"
      >
        <CalendarDays className="h-4 w-4 mr-1" />
        Yesterday
      </Button>
      
      <Button
        variant={selected === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onSelect('all')}
        className="h-8"
      >
        All Time
      </Button>
    </div>
  )
}