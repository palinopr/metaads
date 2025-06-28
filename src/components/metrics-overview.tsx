"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Eye, MousePointer, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Metric {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: "up" | "down";
}

export function MetricsOverview() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    // Simulated data - replace with API call
    setMetrics([
      {
        title: "Total Spend",
        value: formatCurrency(48750),
        change: "+12% from last month",
        icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
        trend: "up",
      },
      {
        title: "Total Impressions",
        value: formatNumber(2847000),
        change: "+18% from last month",
        icon: <Eye className="h-4 w-4 text-muted-foreground" />,
        trend: "up",
      },
      {
        title: "Total Clicks",
        value: formatNumber(34200),
        change: "+21% from last month",
        icon: <MousePointer className="h-4 w-4 text-muted-foreground" />,
        trend: "up",
      },
      {
        title: "Average ROAS",
        value: "4.2x",
        change: "+0.8x from last month",
        icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
        trend: "up",
      },
    ]);
  }, []);

  return (
    <>
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className={`text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
              {metric.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}