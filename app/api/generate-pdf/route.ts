import { NextResponse } from "next/server"
import { generateEnhancedHTMLReport } from '@/lib/pdf-generator'

export async function POST(request: Request) {
  try {
    const { analysis, campaigns, overviewData, chartsData, exportOptions, datePreset } = await request.json()

    // Generate enhanced HTML report with beautiful styling
    const htmlContent = generateEnhancedHTMLReport({
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
      message: 'Enhanced PDF report generated. Use browser print to save as PDF.'
    })

  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to generate PDF'
    }, { status: 500 })
  }
}