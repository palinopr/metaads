import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { analysis, campaigns, overviewData, chartsData, exportOptions, datePreset } = await request.json()

    // For now, return the HTML content that can be saved as PDF by the browser
    // TODO: Implement server-side PDF generation with Puppeteer
    
    const htmlContent = generateHTMLReport({
      analysis,
      campaigns,
      overviewData,
      chartsData,
      exportOptions,
      datePreset
    })

    return NextResponse.json({
      success: true,
      htmlContent,
      message: 'HTML report generated. Use browser print to save as PDF.'
    })

  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to generate PDF'
    }, { status: 500 })
  }
}

function generateHTMLReport({ analysis, campaigns, overviewData, chartsData, exportOptions, datePreset }: any) {
  const formatCurrency = (num: number) => `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const formatNumber = (num: number) => num.toLocaleString('en-US')

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Meta Ads AI Analysis Report</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 100%;
                margin: 0;
                padding: 20px;
                background: white;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #1f2937;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #1f2937;
                margin: 0;
                font-size: 28px;
                font-weight: 700;
            }
            .header .subtitle {
                color: #6b7280;
                font-size: 16px;
                margin-top: 5px;
            }
            .overview-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .metric-card {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .metric-card .label {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 5px;
            }
            .metric-card .value {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
            }
            .section {
                margin-bottom: 40px;
                page-break-inside: avoid;
            }
            .section h2 {
                color: #1f2937;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 10px;
                font-size: 20px;
                margin-bottom: 20px;
            }
            .campaign-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .campaign-table th,
            .campaign-table td {
                border: 1px solid #e5e7eb;
                padding: 12px;
                text-align: left;
            }
            .campaign-table th {
                background: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            .campaign-table tr:nth-child(even) {
                background: #f9fafb;
            }
            .status-active {
                background: #dcfce7;
                color: #166534;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
            .status-paused {
                background: #fef3c7;
                color: #92400e;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
            .roas-excellent { color: #059669; font-weight: 600; }
            .roas-good { color: #0891b2; font-weight: 600; }
            .roas-average { color: #d97706; font-weight: 600; }
            .roas-poor { color: #dc2626; font-weight: 600; }
            .analysis-section {
                background: #f8fafc;
                border-left: 4px solid #3b82f6;
                padding: 20px;
                margin: 20px 0;
                border-radius: 0 8px 8px 0;
            }
            .recommendation {
                background: #ecfdf5;
                border: 1px solid #a7f3d0;
                padding: 15px;
                margin: 10px 0;
                border-radius: 6px;
            }
            .recommendation h4 {
                color: #065f46;
                margin: 0 0 10px 0;
                font-size: 16px;
            }
            .chart-container {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                text-align: center;
            }
            .page-break {
                page-break-before: always;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
            }
            ul li {
                margin-bottom: 8px;
            }
            .highlight {
                background: #fef3c7;
                padding: 2px 4px;
                border-radius: 3px;
            }
        </style>
        ${exportOptions.includeCharts ? `
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        ` : ''}
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <h1>Meta Ads Performance Analysis</h1>
            <div class="subtitle">
                AI-Powered Campaign Analysis Report • ${datePreset.replace(/_/g, ' ').toUpperCase()} • 
                Generated on ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
            </div>
        </div>

        <!-- Overview Metrics -->
        <div class="overview-grid">
            <div class="metric-card">
                <div class="label">Total Spend</div>
                <div class="value">${formatCurrency(overviewData.totalSpend || 0)}</div>
            </div>
            <div class="metric-card">
                <div class="label">Total Revenue</div>
                <div class="value">${formatCurrency(overviewData.totalRevenue || 0)}</div>
            </div>
            <div class="metric-card">
                <div class="label">Overall ROAS</div>
                <div class="value">${(overviewData.overallROAS || 0).toFixed(2)}x</div>
            </div>
            <div class="metric-card">
                <div class="label">Total Conversions</div>
                <div class="value">${formatNumber(overviewData.totalConversions || 0)}</div>
            </div>
        </div>

        <!-- Executive Summary -->
        <div class="section">
            <h2>Executive Summary</h2>
            <div class="analysis-section">
                ${analysis.executiveSummary ? 
                  analysis.executiveSummary.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Executive summary will be generated based on campaign performance data.</p>'
                }
            </div>
        </div>

        <!-- Campaign Performance Table -->
        <div class="section">
            <h2>Campaign Performance Overview</h2>
            <table class="campaign-table">
                <thead>
                    <tr>
                        <th>Campaign</th>
                        <th>Status</th>
                        <th>Spend</th>
                        <th>Revenue</th>
                        <th>ROAS</th>
                        <th>Conversions</th>
                        <th>CTR</th>
                        <th>CPC</th>
                    </tr>
                </thead>
                <tbody>
                    ${campaigns.map((campaign: any) => {
                      const roasClass = 
                        campaign.roas >= 4 ? 'roas-excellent' :
                        campaign.roas >= 2.5 ? 'roas-good' :
                        campaign.roas >= 1.5 ? 'roas-average' : 'roas-poor'
                      
                      return `
                        <tr>
                            <td><strong>${campaign.name}</strong></td>
                            <td>
                                <span class="status-${campaign.status.toLowerCase()}">
                                    ${campaign.status}
                                </span>
                            </td>
                            <td>${formatCurrency(campaign.spend || 0)}</td>
                            <td>${formatCurrency(campaign.revenue || 0)}</td>
                            <td class="${roasClass}">${(campaign.roas || 0).toFixed(2)}x</td>
                            <td>${formatNumber(campaign.conversions || 0)}</td>
                            <td>${(campaign.ctr || 0).toFixed(2)}%</td>
                            <td>${formatCurrency(campaign.cpc || 0)}</td>
                        </tr>
                      `
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${exportOptions.includeCharts && chartsData ? `
        <div class="section page-break">
            <h2>Performance Visualizations</h2>
            <div class="chart-container">
                <h3>Campaign ROAS Comparison</h3>
                <p>Visual representation of campaign performance metrics</p>
                <!-- Charts would be rendered here in a real implementation -->
                <div style="height: 300px; background: #f3f4f6; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #6b7280;">
                    Chart: Campaign ROAS vs Spend Analysis
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Detailed Analysis -->
        <div class="section ${exportOptions.includeCharts ? '' : 'page-break'}">
            <h2>Campaign Performance Analysis</h2>
            <div class="analysis-section">
                ${analysis.campaignAnalysis ? 
                  analysis.campaignAnalysis.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Detailed campaign analysis based on performance metrics and trends.</p>'
                }
            </div>
        </div>

        ${exportOptions.includeRecommendations ? `
        <div class="section page-break">
            <h2>Strategic Recommendations</h2>
            <div class="recommendation">
                <h4>💡 Optimization Opportunities</h4>
                ${analysis.optimizationOpportunities ? 
                  analysis.optimizationOpportunities.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>AI-powered recommendations for campaign optimization.</p>'
                }
            </div>
            
            <div class="recommendation">
                <h4>🎯 Strategic Recommendations</h4>
                ${analysis.strategicRecommendations ? 
                  analysis.strategicRecommendations.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Long-term strategic recommendations for account growth.</p>'
                }
            </div>

            <div class="recommendation">
                <h4>🚀 Action Plan</h4>
                ${analysis.actionPlan ? 
                  analysis.actionPlan.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Prioritized action items for immediate implementation.</p>'
                }
            </div>
        </div>
        ` : ''}

        ${exportOptions.includeCompetitorInsights ? `
        <div class="section page-break">
            <h2>Industry Benchmarks & Competitive Analysis</h2>
            <div class="analysis-section">
                ${analysis.industryBenchmarks ? 
                  analysis.industryBenchmarks.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Industry benchmark comparison and competitive positioning analysis.</p>'
                }
            </div>
        </div>
        ` : ''}

        <!-- Technical Insights -->
        <div class="section page-break">
            <h2>Technical Insights</h2>
            <div class="analysis-section">
                ${analysis.technicalInsights ? 
                  analysis.technicalInsights.split('\n').map((line: string) => `<p>${line}</p>`).join('') :
                  '<p>Technical analysis of ad delivery, targeting efficiency, and optimization opportunities.</p>'
                }
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>
                This report was generated using AI-powered analysis by Claude Opus • 
                Report generated on ${new Date().toLocaleString()} • 
                Data period: ${datePreset.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p>
                <strong>Disclaimer:</strong> This analysis is based on available campaign data and AI interpretation. 
                Please verify recommendations with your specific business context and goals.
            </p>
        </div>
    </body>
    </html>
  `
}