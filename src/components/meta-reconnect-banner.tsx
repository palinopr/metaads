import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

interface MetaReconnectBannerProps {
  debug?: {
    accountId: string
    accountName: string
    help: string
  }
}

export function MetaReconnectBanner({ debug }: MetaReconnectBannerProps) {
  if (!debug) return null

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Meta Account Connection Issue</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Your Meta ad account connection needs to be updated. The current account ID format is incompatible with Meta's API.
        </p>
        <div className="text-sm space-y-1">
          <p><strong>Current Account:</strong> {debug.accountName}</p>
          <p className="text-xs text-muted-foreground">ID: {debug.accountId}</p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="sm">
            <Link href="/dashboard/connections">
              <ExternalLink className="mr-2 h-4 w-4" />
              Reconnect Meta Account
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}