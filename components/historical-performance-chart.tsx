'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { formatNumberWithCommas, safeToFixed } from '@/lib/utils'

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  conversions: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
}

interface HistoricalPerformanceChartProps {
  data: HistoricalDataPoint[]
}

export function HistoricalPerformanceChart({ data }: HistoricalPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No historical data available
      </div>
    )
  }

  // Ensure data is valid
  const validData = data.map(point => ({
    ...point,
    spend: Number(point.spend) || 0,
    revenue: Number(point.revenue) || 0,
    roas: Number(point.roas) || 0,
    conversions: Number(point.conversions) || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={validData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(107, 114, 128, 0.2)" />
        <XAxis
          dataKey="date"
          stroke="#9CA3AF"
          fontSize={10}
          tickFormatter={(date) => {
            try {
              return new Date(date).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })
            } catch {
              return date
            }
          }}
        />
        <YAxis
          yAxisId="left"
          stroke="#818CF8"
          fontSize={10}
          tickFormatter={(val) => `$${formatNumberWithCommas(val)}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#34D399"
          fontSize={10}
          tickFormatter={(val) => `${safeToFixed(Number(val), 1)}x`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(31, 41, 55, 0.9)",
            border: "1px solid #4B5563",
            borderRadius: "0.375rem",
          }}
          labelFormatter={(date) => {
            try {
              return new Date(date).toLocaleDateString()
            } catch {
              return date
            }
          }}
          formatter={(value: any) => {
            if (typeof value === 'number') {
              return value.toFixed(2)
            }
            return value
          }}
        />
        <Legend wrapperStyle={{ fontSize: "10px" }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="spend"
          stroke="#3B82F6"
          name="Spend"
          dot={false}
          strokeWidth={1.5}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="roas"
          stroke="#10B981"
          name="ROAS"
          dot={false}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}