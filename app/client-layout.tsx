"use client"

import { APIMonitor } from "@/components/api-monitor"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && <APIMonitor />}
    </>
  )
}