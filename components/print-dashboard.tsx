'use client'

import React, { useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import html2canvas from 'html2canvas'

interface PrintDashboardProps {
  children: React.ReactNode
  fileName?: string
}

export function PrintDashboard({ children, fileName = 'meta-ads-dashboard' }: PrintDashboardProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadImage = async () => {
    if (!printRef.current) return

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (error) {
      console.error('Error capturing dashboard:', error)
    }
  }

  return (
    <>
      {/* Print/Download Controls */}
      <div className="flex gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          Print Dashboard
        </Button>
        <Button onClick={handleDownloadImage} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download as Image
        </Button>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:break-before-page {
            page-break-before: always;
          }
          
          .print\\:break-inside-avoid {
            page-break-inside: avoid;
          }
          
          /* Ensure backgrounds are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Adjust chart sizes for print */
          .chart-container {
            max-height: 400px !important;
          }
          
          /* Ensure tables fit on page */
          table {
            font-size: 12px;
          }
          
          /* Dark mode adjustments for print */
          .dark {
            background: white !important;
            color: black !important;
          }
          
          .dark * {
            background-color: transparent !important;
            color: black !important;
            border-color: #e5e7eb !important;
          }
          
          .dark .bg-gray-800,
          .dark .bg-gray-900 {
            background-color: #f9fafb !important;
          }
          
          .dark .text-white,
          .dark .text-gray-100,
          .dark .text-gray-200 {
            color: black !important;
          }
          
          /* Print-friendly borders */
          .border {
            border-width: 1px !important;
            border-color: #d1d5db !important;
          }
          
          /* Adjust shadows for print */
          .shadow-lg,
          .shadow-md,
          .shadow {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
          }
        }
      `}</style>

      {/* Dashboard Content */}
      <div ref={printRef} className="print-dashboard-content">
        {children}
      </div>
    </>
  )
}