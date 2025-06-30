import { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bot, Settings, Shield, ArrowLeft } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                <Link href="/dashboard/admin/agent-settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                  >
                    <Bot className="h-4 w-4 mr-2" />
                    Agent Settings
                  </Button>
                </Link>
                <Link href="/dashboard/admin/system">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    size="sm"
                    disabled
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    System Settings
                  </Button>
                </Link>
              </nav>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}