import html2canvas from 'html2canvas'

export interface PDFReportData {
  analysis: any
  campaigns: any[]
  overviewData: any
  chartsData: any
  exportOptions: any
  datePreset: string
}

export function generateEnhancedHTMLReport(data: PDFReportData): string {
  const { analysis, campaigns, overviewData, chartsData, exportOptions, datePreset } = data
  
  // Debug logging
  console.log('PDF Generation - Campaigns received:', campaigns?.length || 0)
  console.log('PDF Generation - Overview data:', overviewData)
  
  const formatCurrency = (num: number) => 
    `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  
  const formatNumber = (num: number) => num.toLocaleString('en-US')
  
  const formatPercentage = (num: number) => `${num.toFixed(2)}%`
  
  const getRoasColor = (roas: number) => {
    if (roas >= 4) return '#10b981' // green-500
    if (roas >= 2.5) return '#3b82f6' // blue-500
    if (roas >= 1.5) return '#f59e0b' // amber-500
    return '#ef4444' // red-500
  }
  
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return '#10b981'
      case 'PAUSED': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  // Generate chart data for JSON embedding
  const chartConfigs = {
    roasChart: {
      type: 'bar',
      data: {
        labels: campaigns.map(c => c.name.length > 30 ? c.name.substring(0, 30) + '...' : c.name),
        datasets: [{
          label: 'ROAS',
          data: campaigns.map(c => c.roas || 0),
          backgroundColor: campaigns.map(c => getRoasColor(c.roas || 0)),
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Campaign ROAS Performance' }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'ROAS (x)' }
          }
        }
      }
    },
    spendRevenueChart: {
      type: 'bar',
      data: {
        labels: campaigns.map(c => c.name.length > 30 ? c.name.substring(0, 30) + '...' : c.name),
        datasets: [
          {
            label: 'Spend',
            data: campaigns.map(c => c.spend || 0),
            backgroundColor: '#ef4444',
            borderRadius: 6
          },
          {
            label: 'Revenue',
            data: campaigns.map(c => c.revenue || 0),
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Spend vs Revenue Comparison' }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Amount ($)' }
          }
        }
      }
    },
    performanceMetricsChart: {
      type: 'radar',
      data: {
        labels: ['CTR', 'Conversion Rate', 'ROAS', 'CPC Efficiency', 'Impressions'],
        datasets: campaigns.slice(0, 3).map((campaign, index) => ({
          label: campaign.name.substring(0, 20) + '...',
          data: [
            Math.min((campaign.ctr || 0) * 10, 100), // Normalize CTR
            Math.min((campaign.conversions / (campaign.clicks || 1)) * 100, 100), // Conv rate
            Math.min((campaign.roas || 0) * 20, 100), // Normalize ROAS
            Math.min(100 - ((campaign.cpc || 0) * 10), 100), // CPC efficiency
            Math.min((campaign.impressions / 100000) * 10, 100) // Normalize impressions
          ],
          backgroundColor: `rgba(${index === 0 ? '59, 130, 246' : index === 1 ? '16, 185, 129' : '245, 158, 11'}, 0.2)`,
          borderColor: `rgb(${index === 0 ? '59, 130, 246' : index === 1 ? '16, 185, 129' : '245, 158, 11'})`,
          pointBackgroundColor: `rgb(${index === 0 ? '59, 130, 246' : index === 1 ? '16, 185, 129' : '245, 158, 11'})`
        }))
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: 'Campaign Performance Metrics' }
        },
        scales: {
          r: {
            angleLines: { display: false },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    }
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; img-src * data:; font-src *;">
        <title>Meta Ads AI Analysis Report - ${new Date().toLocaleDateString()}</title>
        
        <!-- Tailwind CSS -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Chart.js -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        
        <!-- Custom Tailwind Config -->
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  gray: {
                    900: '#111827',
                    800: '#1f2937',
                    700: '#374151',
                    600: '#4b5563',
                    400: '#9ca3af',
                    300: '#d1d5db',
                    200: '#e5e7eb',
                    100: '#f3f4f6',
                    50: '#f9fafb'
                  }
                }
              }
            }
          }
        </script>
        
        <style>
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar { width: 8px; height: 8px; }
          ::-webkit-scrollbar-track { background: #f1f1f1; }
          ::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #555; }
          
          /* Animations */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.5s ease-out; }
          
          /* Chart container */
          .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
          }
          
          /* Custom table styles */
          .campaign-table {
            border-collapse: separate;
            border-spacing: 0;
          }
          .campaign-table thead th {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #1f2937;
          }
          
          /* Gradient backgrounds */
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .gradient-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        </style>
    </head>
    <body class="bg-gray-50 text-gray-900">
        <!-- Isolated content wrapper to prevent extension interference -->
        <div id="pdf-report-content" style="isolation: isolate; position: relative; z-index: 1;">
        
        <!-- Modern Header -->
        <div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-lg shadow-xl mb-8">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-4xl font-bold mb-2">Meta Ads Performance Report</h1>
                        <p class="text-gray-300 text-lg">
                            AI-Powered Analysis by Claude Opus • ${datePreset.replace(/_/g, ' ').toUpperCase()}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Generated on</p>
                        <p class="text-xl font-semibold">${new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- KPI Cards -->
        <div class="grid grid-cols-4 gap-6 mb-8 fade-in">
            <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium uppercase">Total Spend</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${formatCurrency(overviewData.totalSpend || 0)}</p>
                    </div>
                    <div class="text-blue-500">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">Campaign investment</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium uppercase">Total Revenue</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${formatCurrency(overviewData.totalRevenue || 0)}</p>
                    </div>
                    <div class="text-green-500">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">Generated returns</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium uppercase">Overall ROAS</p>
                        <p class="text-3xl font-bold mt-1">
                            <span style="color: ${getRoasColor(overviewData.overallROAS || 0)}">
                                ${(overviewData.overallROAS || 0).toFixed(2)}x
                            </span>
                        </p>
                    </div>
                    <div class="text-purple-500">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">Return on ad spend</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-amber-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium uppercase">Conversions</p>
                        <p class="text-3xl font-bold text-gray-900 mt-1">${formatNumber(overviewData.totalConversions || 0)}</p>
                    </div>
                    <div class="text-amber-500">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">Total conversions</p>
            </div>
        </div>

        <!-- Executive Summary -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Executive Summary
            </h2>
            <div class="prose max-w-none text-gray-700">
                ${analysis.executiveSummary ? 
                  analysis.executiveSummary.split('\n').map((line: string) => 
                    line.trim() ? `<p class="mb-3">${line}</p>` : ''
                  ).join('') :
                  '<p class="text-gray-500 italic">Executive summary will be generated based on campaign performance data.</p>'
                }
            </div>
        </div>

        <!-- Campaign Performance Table -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Campaign Performance Details
            </h2>
            
            <div class="overflow-x-auto">
                <table class="campaign-table w-full">
                    <thead>
                        <tr class="text-left">
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold rounded-tl-lg">Campaign</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-center">Status</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-right">Spend</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-right">Revenue</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-center">ROAS</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-right">Conversions</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-center">CTR</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-right">CPC</th>
                            <th class="px-4 py-3 bg-gray-800 text-white font-semibold text-right rounded-tr-lg">CPA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns && campaigns.length > 0 ? campaigns.map((campaign: any, index: number) => `
                            <tr class="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-4">
                                    <div class="font-medium text-gray-900">${campaign.name || 'Unnamed Campaign'}</div>
                                    <div class="text-sm text-gray-500">ID: ${campaign.id || 'N/A'}</div>
                                </td>
                                <td class="px-4 py-4 text-center">
                                    <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full" 
                                          style="background-color: ${getStatusColor(campaign.status || 'UNKNOWN')}20; color: ${getStatusColor(campaign.status || 'UNKNOWN')}">
                                        ${campaign.status || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td class="px-4 py-4 text-right font-medium">${formatCurrency(campaign.spend || 0)}</td>
                                <td class="px-4 py-4 text-right font-medium">${formatCurrency(campaign.revenue || 0)}</td>
                                <td class="px-4 py-4 text-center">
                                    <span class="font-bold text-lg" style="color: ${getRoasColor(campaign.roas || 0)}">
                                        ${(campaign.roas || 0).toFixed(2)}x
                                    </span>
                                </td>
                                <td class="px-4 py-4 text-right">${formatNumber(campaign.conversions || 0)}</td>
                                <td class="px-4 py-4 text-center">${formatPercentage(campaign.ctr || 0)}</td>
                                <td class="px-4 py-4 text-right">${formatCurrency(campaign.cpc || 0)}</td>
                                <td class="px-4 py-4 text-right">${formatCurrency(campaign.cpa || 0)}</td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                                    No campaign data available to display.
                                </td>
                            </tr>
                        `}
                    </tbody>
                    <tfoot>
                        <tr class="bg-gray-100 font-semibold">
                            <td class="px-4 py-3 rounded-bl-lg">Total</td>
                            <td class="px-4 py-3"></td>
                            <td class="px-4 py-3 text-right">${formatCurrency(overviewData.totalSpend || 0)}</td>
                            <td class="px-4 py-3 text-right">${formatCurrency(overviewData.totalRevenue || 0)}</td>
                            <td class="px-4 py-3 text-center">
                                <span style="color: ${getRoasColor(overviewData.overallROAS || 0)}">
                                    ${(overviewData.overallROAS || 0).toFixed(2)}x
                                </span>
                            </td>
                            <td class="px-4 py-3 text-right">${formatNumber(overviewData.totalConversions || 0)}</td>
                            <td class="px-4 py-3" colspan="3" class="rounded-br-lg"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        ${exportOptions.includeCharts ? `
        <!-- Charts Section -->
        <div class="page-break bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
                Performance Visualizations
            </h2>
            
            <div class="grid grid-cols-2 gap-6">
                <div class="chart-container bg-gray-50 p-4 rounded-lg">
                    <canvas id="roasChart"></canvas>
                </div>
                <div class="chart-container bg-gray-50 p-4 rounded-lg">
                    <canvas id="spendRevenueChart"></canvas>
                </div>
            </div>
            
            <div class="mt-6">
                <div class="chart-container bg-gray-50 p-4 rounded-lg" style="height: 500px;">
                    <canvas id="performanceMetricsChart"></canvas>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Detailed Analysis -->
        <div class="page-break bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                Campaign Performance Analysis
            </h2>
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg prose max-w-none">
                ${analysis.campaignAnalysis ? 
                  analysis.campaignAnalysis.split('\n').map((line: string) => 
                    line.trim() ? `<p class="mb-3 text-gray-700">${line}</p>` : ''
                  ).join('') :
                  '<p class="text-gray-500 italic">Detailed campaign analysis based on performance metrics and trends.</p>'
                }
            </div>
        </div>

        ${exportOptions.includeRecommendations ? `
        <!-- Recommendations Section -->
        <div class="page-break bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Strategic Recommendations
            </h2>
            
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-l-4 border-green-500">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span class="text-2xl mr-2">💡</span>
                        Optimization Opportunities
                    </h3>
                    <div class="prose max-w-none text-gray-700">
                        ${analysis.optimizationOpportunities ? 
                          analysis.optimizationOpportunities.split('\n').map((line: string) => 
                            line.trim() ? `<p class="mb-2">${line}</p>` : ''
                          ).join('') :
                          '<p class="text-gray-500 italic">AI-powered recommendations for campaign optimization.</p>'
                        }
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span class="text-2xl mr-2">🎯</span>
                        Strategic Recommendations
                    </h3>
                    <div class="prose max-w-none text-gray-700">
                        ${analysis.strategicRecommendations ? 
                          analysis.strategicRecommendations.split('\n').map((line: string) => 
                            line.trim() ? `<p class="mb-2">${line}</p>` : ''
                          ).join('') :
                          '<p class="text-gray-500 italic">Long-term strategic recommendations for account growth.</p>'
                        }
                    </div>
                </div>

                <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-l-4 border-purple-500">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <span class="text-2xl mr-2">🚀</span>
                        Action Plan
                    </h3>
                    <div class="prose max-w-none text-gray-700">
                        ${analysis.actionPlan ? 
                          analysis.actionPlan.split('\n').map((line: string) => 
                            line.trim() ? `<p class="mb-2">${line}</p>` : ''
                          ).join('') :
                          '<p class="text-gray-500 italic">Prioritized action items for immediate implementation.</p>'
                        }
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${exportOptions.includeCompetitorInsights ? `
        <!-- Industry Benchmarks -->
        <div class="page-break bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
                Industry Benchmarks & Competitive Analysis
            </h2>
            <div class="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg prose max-w-none">
                ${analysis.industryBenchmarks ? 
                  analysis.industryBenchmarks.split('\n').map((line: string) => 
                    line.trim() ? `<p class="mb-3 text-gray-700">${line}</p>` : ''
                  ).join('') :
                  '<p class="text-gray-500 italic">Industry benchmark comparison and competitive positioning analysis.</p>'
                }
            </div>
        </div>
        ` : ''}

        <!-- Technical Insights -->
        <div class="page-break bg-white rounded-lg shadow-lg p-8 mb-8 fade-in">
            <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <svg class="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Technical Insights
            </h2>
            <div class="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg prose max-w-none">
                ${analysis.technicalInsights ? 
                  analysis.technicalInsights.split('\n').map((line: string) => 
                    line.trim() ? `<p class="mb-3 text-gray-700">${line}</p>` : ''
                  ).join('') :
                  '<p class="text-gray-500 italic">Technical analysis of ad delivery, targeting efficiency, and optimization opportunities.</p>'
                }
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-12 pt-8 border-t-2 border-gray-200 text-center text-gray-500 text-sm">
            <p class="mb-2">
                <strong>Report Generated by:</strong> Meta Ads Dashboard with Claude Opus AI Analysis
            </p>
            <p class="mb-2">
                <strong>Generation Date:</strong> ${new Date().toLocaleString()} • 
                <strong>Data Period:</strong> ${datePreset.replace(/_/g, ' ').toUpperCase()}
            </p>
            <p class="text-xs mt-4 max-w-3xl mx-auto">
                <strong>Disclaimer:</strong> This report is generated using AI-powered analysis of your Meta advertising data. 
                All recommendations should be reviewed and validated against your specific business objectives and constraints. 
                Performance predictions are based on historical data and may not reflect future results.
            </p>
        </div>

        ${exportOptions.includeCharts ? `
        <!-- Initialize Charts -->
        <script>
            // Wait for DOM to load
            document.addEventListener('DOMContentLoaded', function() {
                // ROAS Chart
                const roasCtx = document.getElementById('roasChart').getContext('2d');
                new Chart(roasCtx, ${JSON.stringify(chartConfigs.roasChart)});
                
                // Spend vs Revenue Chart
                const spendRevenueCtx = document.getElementById('spendRevenueChart').getContext('2d');
                new Chart(spendRevenueCtx, ${JSON.stringify(chartConfigs.spendRevenueChart)});
                
                // Performance Metrics Radar Chart
                const performanceCtx = document.getElementById('performanceMetricsChart').getContext('2d');
                new Chart(performanceCtx, ${JSON.stringify(chartConfigs.performanceMetricsChart)});
            });
        </script>
        ` : ''}
        
        </div> <!-- End isolated content wrapper -->
    </body>
    </html>
  `
}