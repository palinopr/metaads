"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Play, Pause, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Campaign {
  id: string
  name: string
  status: "active" | "paused" | "draft"
  budget: number
  spent: number
  impressions: number
  clicks: number
  startDate: Date
  endDate?: Date
}

interface CampaignListProps {
  campaigns: Campaign[]
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "draft":
        return "bg-gray-500"
    }
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No campaigns found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{campaign.name}</CardTitle>
                <Badge variant="outline" className="capitalize">
                  <span className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(campaign.status)}`} />
                  {campaign.status}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {campaign.status === "active" ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-medium">${campaign.budget.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Spent</p>
                <p className="font-medium">${campaign.spent.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Impressions</p>
                <p className="font-medium">{campaign.impressions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clicks</p>
                <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}