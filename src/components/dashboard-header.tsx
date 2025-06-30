"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, Settings, LogOut, Building2, Plus } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

interface SelectedAccount {
  account_id: string
  name: string
  currency: string
  timezone_name: string
}

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSelectedAccount()
  }, [])

  const fetchSelectedAccount = async () => {
    try {
      const response = await fetch("/api/connections/meta/selected-account")
      const data = await response.json()
      if (data.account) {
        setSelectedAccount(data.account)
      }
    } catch (error) {
      console.error("Error fetching selected account:", error)
    } finally {
      setLoading(false)
    }
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo/Brand */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <h1 className="text-lg font-semibold gradient-text">MetaAds</h1>
        </Link>

        {/* Account Selector */}
        <div className="flex-1">
          {!loading && selectedAccount ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9 focus-ring">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="max-w-[200px] truncate">{selectedAccount.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[300px]">
                <DropdownMenuLabel>Ad Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex-col items-start">
                  <div className="font-medium">{selectedAccount.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {selectedAccount.account_id} • {selectedAccount.currency}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard/connections/meta/accounts")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Switch Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/connections")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Connections
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/connections")}
              disabled={loading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Ad Account
            </Button>
          )}
        </div>

        {/* Create Button */}
        <Button size="sm" className="h-9" onClick={() => router.push("/dashboard/campaigns/create")}>
          <Plus className="mr-2 h-4 w-4" />
          Create
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}