"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
}

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated data for demo
  useEffect(() => {
    setTimeout(() => {
      setCampaigns([
        {
          id: "1",
          name: "Summer Sale Campaign",
          status: "ACTIVE",
          spend: 4280.50,
          impressions: 284000,
          clicks: 3420,
          conversions: 142,
          roas: 4.2,
        },
        {
          id: "2",
          name: "Brand Awareness Q4",
          status: "ACTIVE",
          spend: 2150.25,
          impressions: 156000,
          clicks: 1890,
          conversions: 78,
          roas: 3.8,
        },
        {
          id: "3",
          name: "Product Launch - Electronics",
          status: "PAUSED",
          spend: 890.00,
          impressions: 67000,
          clicks: 890,
          conversions: 23,
          roas: 2.1,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Spend</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">ROAS</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const ctr = (campaign.clicks / campaign.impressions) * 100;
            
            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(campaign.spend)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.impressions)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.clicks)}
                </TableCell>
                <TableCell className="text-right">
                  {formatPercentage(ctr)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(campaign.conversions)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {campaign.roas}x
                    {campaign.roas >= 4 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}