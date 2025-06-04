"use client"
import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Target, DollarSign, Users, Zap, AlertTriangle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { formatCurrency } from "@/lib/utils"

interface CampaignMain {
  id: string
  name: string
  created_time: string
  processedInsights?: {
    // Make processedInsights optional as it might not always be there
    spend: number
    revenue: number
    roas: string | number // Allow string or number for ROAS
    conversions: number
    ctr?: number // Optional
    cpc?: number // Optional
    impressions?: number // Optional
  }
  // Add other fields if campaign object has more that AI might use
  objective?: string
  status?: string
}

interface HistoricalDataPoint {
  date: string
  spend: number
  revenue: number
  roas: number
  conversions: number
}

interface AIAnalysisModalProps {
  campaign: CampaignMain
  historicalData?: HistoricalDataPoint[]
  allCampaigns?: CampaignMain[]
  triggerButtonText?: string // Optional custom text for the trigger button
}

interface AIResponseContext {
  eventType?: string
  city?: string
  stage?: string
  timeSlot?: string
}

interface AIResponseBenchmarks {
  avgROAS?: number
  avgSpend?: number
  avgRevenue?: number
}

interface AIAnalysisData {
  fullAnalysis: string
  context?: AIResponseContext
  benchmarks?: AIResponseBenchmarks
  similarCampaignsCount?: number
  generatedAt: string
  error?: string
}

export function AIAnalysisModal({ campaign, historicalData, allCampaigns, triggerButtonText }: AIAnalysisModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const handleAnalyze = useCallback(async () => {
    if (!campaign) return
    setIsLoading(true)
    setAnalysis(null)

    try {
      const campaignDataForAPI = {
        name: campaign.name,
        created_time: campaign.created_time,
        objective: campaign.objective,
        status: campaign.status,
        ...(campaign.processedInsights && {
          // Only spread if processedInsights exists
          spend: campaign.processedInsights.spend,
          revenue: campaign.processedInsights.revenue,
          roas:
            typeof campaign.processedInsights.roas === "string"
              ? Number.parseFloat(campaign.processedInsights.roas)
              : campaign.processedInsights.roas,
          conversions: campaign.processedInsights.conversions,
          ctr: campaign.processedInsights.ctr,
          cpc: campaign.processedInsights.cpc,
          impressions: campaign.processedInsights.impressions,
        }),
        daysSinceStart: Math.floor((Date.now() - new Date(campaign.created_time).getTime()) / (1000 * 60 * 60 * 24)),
      }

      const similarCampaignsForAPI = allCampaigns
        ?.filter((c) => c.id !== campaign.id)
        .map((c) => ({
          name: c.name,
          objective: c.objective,
          status: c.status,
          ...(c.processedInsights && {
            // Only spread if processedInsights exists
            spend: c.processedInsights.spend,
            revenue: c.processedInsights.revenue,
            roas:
              typeof c.processedInsights.roas === "string"
                ? Number.parseFloat(c.processedInsights.roas)
                : c.processedInsights.roas,
            conversions: c.processedInsights.conversions,
          }),
        }))

      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign: campaignDataForAPI,
          historicalData: historicalData,
          similarCampaigns: similarCampaignsForAPI,
        }),
      })

      const data: AIAnalysisData = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "AI Analysis request failed")
      }
      setAnalysis(data)
    } catch (error: any) {
      console.error("Failed to get AI analysis:", error)
      setAnalysis({
        fullAnalysis: `Failed to generate AI analysis. ${error.message || "Please try again."}`,
        error: error.message || "Unknown error",
        generatedAt: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [campaign, historicalData, allCampaigns])

  const getContextIcon = (eventType?: string) => {
    if (!eventType) return "🎉"
    const lowerEventType = eventType.toLowerCase()
    if (lowerEventType.includes("reggaeton")) return "🎵"
    if (lowerEventType.includes("r&b") || lowerEventType.includes("rnb")) return "🎤"
    if (lowerEventType.includes("comedy")) return "😄"
    if (lowerEventType.includes("sports") || lowerEventType.includes("sport")) return "⚽"
    if (lowerEventType.includes("concert") || lowerEventType.includes("music")) return "🎶"
    return "🎉"
  }

  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !analysis && !isLoading) {
      handleAnalyze()
    }
  }

  const campaignRoas = campaign.processedInsights?.roas
  const campaignRoasNum = typeof campaignRoas === "string" ? Number.parseFloat(campaignRoas) : (campaignRoas ?? 0)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm" // Made button smaller to fit better in table rows
          className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white border-purple-500/50 hover:from-purple-700 hover:to-blue-700 text-xs px-2.5 py-1 h-auto"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {triggerButtonText || "AI Deep Analysis"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col bg-gray-900 text-white border-gray-700 shadow-2xl rounded-lg">
        <DialogHeader className="p-4 md:p-6 border-b border-gray-700">
          <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2 text-gray-100">
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-purple-400" />
            AI Campaign Analysis: <span className="text-purple-300 truncate max-w-xs md:max-w-md">{campaign.name}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-xs md:text-sm">
            Intelligent insights powered by Claude AI.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center">
              <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-purple-400 mb-4 md:mb-6" />
              <p className="text-md md:text-lg text-gray-300">Claude is analyzing campaign performance...</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">This may take a few moments.</p>
            </div>
          ) : analysis ? (
            <>
              <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                {analysis.context && (
                  <div className="bg-gray-800/70 rounded-lg p-3 md:p-4 border border-gray-700/80 shadow-md">
                    <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-gray-200 text-sm md:text-base">
                      {getContextIcon(analysis.context.eventType)}
                      Campaign Context
                    </h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs md:text-sm">
                      {[
                        { label: "Type", value: analysis.context.eventType },
                        { label: "Location", value: analysis.context.city },
                        { label: "Stage", value: analysis.context.stage || "Active" },
                        { label: "Time Slot", value: analysis.context.timeSlot },
                      ].map(
                        (item) =>
                          item.value && (
                            <div key={item.label}>
                              <span className="text-gray-400">{item.label}:</span>{" "}
                              <p className="font-medium text-gray-100 inline">{item.value}</p>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}

                {analysis.benchmarks && (analysis.similarCampaignsCount || 0) > 0 && campaign.processedInsights && (
                  <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-3 md:p-4 border border-blue-700/60 shadow-md">
                    <h3 className="font-semibold mb-2 md:mb-3 flex items-center gap-2 text-gray-200 text-sm md:text-base">
                      <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                      vs. Benchmarks ({analysis.similarCampaignsCount} similar)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                      {[
                        {
                          label: "ROAS",
                          value: campaignRoasNum,
                          benchmark: analysis.benchmarks.avgROAS,
                          unit: "x",
                          higherIsBetter: true,
                        },
                        {
                          label: "Revenue",
                          value: campaign.processedInsights.revenue,
                          benchmark: analysis.benchmarks.avgRevenue,
                          unit: "$",
                          higherIsBetter: true,
                        },
                        // Add spend if available in benchmarks
                        // { label: "Spend", value: campaign.processedInsights.spend, benchmark: analysis.benchmarks.avgSpend, unit: "$", higherIsBetter: false },
                      ].map(
                        (metric) =>
                          metric.benchmark !== undefined && (
                            <div
                              key={metric.label}
                              className="flex items-center justify-between p-1.5 bg-gray-700/30 rounded"
                            >
                              <span className="text-gray-400">{metric.label}:</span>
                              <span
                                className={`font-bold ${
                                  metric.value > (metric.benchmark || 0) && metric.higherIsBetter
                                    ? "text-green-400"
                                    : metric.value < (metric.benchmark || 0) && !metric.higherIsBetter
                                      ? "text-green-400"
                                      : "text-red-400"
                                }`}
                              >
                                {metric.unit === "$"
                                  ? formatCurrency(metric.value)
                                  : `${metric.value.toFixed(metric.unit === "x" ? 2 : 0)}${metric.unit}`}
                              </span>
                              <span className="text-gray-500 text-[10px] md:text-xs">
                                (Avg:{" "}
                                {metric.unit === "$"
                                  ? formatCurrency(metric.benchmark || 0)
                                  : `${(metric.benchmark || 0).toFixed(metric.unit === "x" ? 2 : 0)}${metric.unit}`}
                                )
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              {analysis.error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 md:p-4 text-red-300 mb-4">
                  <div className="flex items-center gap-2 font-semibold mb-1.5 text-sm md:text-base">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" /> AI Analysis Error
                  </div>
                  <p className="text-xs md:text-sm">{analysis.error}</p>
                  <p className="text-[10px] md:text-xs mt-1.5">Displaying fallback analysis if available.</p>
                </div>
              )}

              <div className="bg-gray-800/80 rounded-lg p-4 md:p-6 border border-gray-700/80 shadow-lg">
                <div className="prose prose-sm sm:prose-base prose-invert max-w-none text-gray-300 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-xl md:text-2xl font-bold mt-4 mb-3 text-purple-300 border-b border-purple-700/50 pb-1.5"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-lg md:text-xl font-semibold mt-3.5 mb-2.5 text-blue-300 flex items-center gap-2"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-md md:text-lg font-medium mt-3 mb-2 text-gray-100" {...props} />
                      ),
                      p: ({ node, ...props }) => <p className="mb-2.5 text-xs md:text-sm" {...props} />,
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-4 mb-3 space-y-1 text-xs md:text-sm" {...props} />
                      ),
                      li: ({ node, ...props }) => <li className="text-gray-300" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold text-gray-100" {...props} />,
                      a: ({ node, ...props }) => (
                        <a className="text-purple-400 hover:text-purple-300 underline" {...props} />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code className="bg-gray-700 text-purple-300 px-1 py-0.5 rounded text-xs" {...props} />
                        ) : (
                          <pre className="bg-gray-700/50 p-2.5 rounded overflow-x-auto text-xs my-2" {...props} />
                        ),
                    }}
                  >
                    {analysis.fullAnalysis}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="bg-gray-800/70 rounded-lg p-3 md:p-4 border border-gray-700/80 shadow-md mt-4">
                <h3 className="font-semibold mb-2 md:mb-3 text-gray-200 text-sm md:text-base">
                  Suggested Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {[
                    {
                      label: "Adjust Budget",
                      icon: <DollarSign className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />,
                      color: "green",
                    },
                    {
                      label: "Refine Audience",
                      icon: <Users className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />,
                      color: "blue",
                    },
                    {
                      label: "Update Creatives",
                      icon: <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1" />,
                      color: "purple",
                    },
                  ].map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className={`text-${action.color}-400 border-${action.color}-600 hover:bg-${action.color}-900/30 hover:border-${action.color}-500 text-xs px-2 py-1 h-auto`}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] md:text-xs text-gray-500 mt-2 md:mt-3">
                  Note: These are illustrative actions. Implement changes based on the full analysis.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-10 md:py-20">
              <p className="text-gray-500 text-sm md:text-base">
                Click the button again or reopen to generate AI insights.
              </p>
            </div>
          )}
        </div>
        {analysis && (
          <div className="p-3 md:p-4 border-t border-gray-700 text-center">
            <p className="text-xs text-gray-500">
              AI analysis generated at {new Date(analysis.generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
