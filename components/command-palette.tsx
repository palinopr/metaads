"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  CalendarIcon,
  FileTextIcon,
  GearIcon,
  PersonIcon,
  RocketIcon,
  BarChartIcon,
  DashboardIcon,
  BrainIcon,
  DollarSignIcon,
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  TrendingUpIcon,
  LayersIcon,
  AlertCircleIcon,
  ActivityIcon,
  ClipboardIcon,
  CreditCardIcon,
  PieChartIcon,
  TargetIcon,
  FilterIcon,
  EyeIcon,
  KeyIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
} from "@radix-ui/react-icons"
import { useTheme } from "next-themes"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

type CommandAction = {
  id: string
  name: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  action: () => void
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme, theme } = useTheme()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigateActions: CommandAction[] = [
    {
      id: "dashboard",
      name: "Go to Dashboard",
      icon: DashboardIcon,
      action: () => {
        router.push("/dashboard")
        setOpen(false)
      },
      keywords: ["home", "main", "overview"],
    },
    {
      id: "reports",
      name: "View Reports",
      icon: FileTextIcon,
      action: () => {
        router.push("/reports")
        setOpen(false)
      },
      keywords: ["analytics", "data", "insights"],
    },
    {
      id: "portfolio",
      name: "Portfolio View",
      icon: LayersIcon,
      action: () => {
        router.push("/portfolio")
        setOpen(false)
      },
      keywords: ["multi", "account", "accounts"],
    },
    {
      id: "pattern-analysis",
      name: "Pattern Analysis",
      icon: BarChartIcon,
      action: () => {
        router.push("/pattern-analysis")
        setOpen(false)
      },
      keywords: ["trends", "patterns", "analysis"],
    },
    {
      id: "realtime",
      name: "Real-time Monitor",
      icon: ActivityIcon,
      action: () => {
        router.push("/realtime")
        setOpen(false)
      },
      keywords: ["live", "monitor", "tracking"],
    },
    {
      id: "settings",
      name: "Settings",
      icon: GearIcon,
      action: () => {
        router.push("/settings")
        setOpen(false)
      },
      keywords: ["config", "configuration", "preferences"],
    },
  ]

  const optimizationActions: CommandAction[] = [
    {
      id: "optimize-campaigns",
      name: "Optimize All Campaigns",
      icon: RocketIcon,
      shortcut: "⌘O",
      action: () => {
        // Trigger campaign optimization
        const event = new CustomEvent('optimize-campaigns')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["optimize", "campaigns", "all", "bulk"],
    },
    {
      id: "daily-budget",
      name: "Daily Budget Optimizer",
      icon: DollarSignIcon,
      shortcut: "⌘B",
      action: () => {
        const event = new CustomEvent('open-daily-budget-optimizer')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["budget", "daily", "optimizer", "money"],
    },
    {
      id: "budget-command",
      name: "Budget Command Center",
      icon: CreditCardIcon,
      action: () => {
        const event = new CustomEvent('toggle-budget-command-center')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["command", "center", "budget", "control"],
    },
    {
      id: "anomaly-detector",
      name: "Performance Anomaly Detector",
      icon: AlertCircleIcon,
      action: () => {
        const event = new CustomEvent('toggle-anomaly-detector')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["anomaly", "detector", "performance", "issues"],
    },
    {
      id: "pattern-analyzer",
      name: "Historical Pattern Analyzer",
      icon: TrendingUpIcon,
      action: () => {
        const event = new CustomEvent('open-pattern-analyzer')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["pattern", "historical", "analyzer", "trends"],
    },
  ]

  const dataActions: CommandAction[] = [
    {
      id: "refresh-data",
      name: "Refresh All Data",
      icon: RefreshCwIcon,
      shortcut: "⌘R",
      action: () => {
        const event = new CustomEvent('refresh-all-data')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["refresh", "reload", "update", "sync"],
    },
    {
      id: "export-pdf",
      name: "Export Report as PDF",
      icon: DownloadIcon,
      shortcut: "⌘E",
      action: () => {
        const event = new CustomEvent('export-pdf-report')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["export", "pdf", "download", "report"],
    },
    {
      id: "filter-campaigns",
      name: "Filter Campaigns",
      icon: FilterIcon,
      action: () => {
        const event = new CustomEvent('open-campaign-filter')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["filter", "campaigns", "search", "find"],
    },
    {
      id: "compare-campaigns",
      name: "Compare Campaigns",
      icon: PieChartIcon,
      action: () => {
        const event = new CustomEvent('open-campaign-comparison')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["compare", "comparison", "versus", "vs"],
    },
  ]

  const settingsActions: CommandAction[] = [
    {
      id: "view-credentials",
      name: "View API Credentials",
      icon: KeyIcon,
      action: () => {
        const event = new CustomEvent('view-credentials')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["api", "credentials", "keys", "tokens"],
    },
    {
      id: "toggle-theme",
      name: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: theme === "dark" ? SunIcon : MoonIcon,
      action: () => {
        setTheme(theme === "dark" ? "light" : "dark")
        setOpen(false)
      },
      keywords: ["theme", "dark", "light", "mode"],
    },
    {
      id: "account-settings",
      name: "Account Settings",
      icon: PersonIcon,
      action: () => {
        router.push("/settings/account")
        setOpen(false)
      },
      keywords: ["account", "profile", "user"],
    },
  ]

  const quickActions: CommandAction[] = [
    {
      id: "ai-insights",
      name: "Generate AI Insights",
      icon: BrainIcon,
      shortcut: "⌘I",
      action: () => {
        const event = new CustomEvent('generate-ai-insights')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["ai", "insights", "analysis", "recommendations"],
    },
    {
      id: "copy-campaign-id",
      name: "Copy Selected Campaign ID",
      icon: ClipboardIcon,
      action: () => {
        const event = new CustomEvent('copy-campaign-id')
        window.dispatchEvent(event)
        setOpen(false)
      },
      keywords: ["copy", "campaign", "id", "clipboard"],
    },
    {
      id: "view-logs",
      name: "View Activity Logs",
      icon: FileTextIcon,
      action: () => {
        router.push("/logs")
        setOpen(false)
      },
      keywords: ["logs", "activity", "history", "audit"],
    },
  ]

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            {navigateActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => action.action()}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                <span>{action.name}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Optimization">
            {optimizationActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => action.action()}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                <span>{action.name}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Data & Reports">
            {dataActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => action.action()}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                <span>{action.name}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => action.action()}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                <span>{action.name}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Settings">
            {settingsActions.map((action) => (
              <CommandItem
                key={action.id}
                onSelect={() => action.action()}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                <span>{action.name}</span>
                {action.shortcut && (
                  <CommandShortcut>{action.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}