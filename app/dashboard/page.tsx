"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Overview } from "@/components/overview"
import { RecentSales } from "@/components/recent-sales"
import { Search } from "@/components/search"
import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DayWeekPerformance } from "@/components/day-week-performance"

export default function DashboardPage() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          Dashboard
        </h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-6 w-6 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This is the dashboard page. It contains an overview of your store, recent sales, and a search bar.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex justify-between">
        <Overview />
        <Search />
      </div>

      <Tabs defaultValue="recent" className="w-full mt-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Sales</TabsTrigger>
          <TabsTrigger value="dayweek">Day/Week Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <RecentSales />
        </TabsContent>
        <TabsContent value="dayweek">
          <DayWeekPerformance />
        </TabsContent>
      </Tabs>
    </div>
  )
}
