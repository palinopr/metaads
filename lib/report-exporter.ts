// import jsPDF from 'jspdf'
// import * as XLSX from 'xlsx'
import { format } from 'date-fns'

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  includeCharts?: boolean
  includeRawData?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ReportData {
  title: string
  subtitle?: string
  date: Date
  sections: ReportSection[]
  metadata?: Record<string, any>
}

export interface ReportSection {
  title: string
  type: 'summary' | 'table' | 'chart' | 'text'
  data: any
  columns?: TableColumn[]
}

export interface TableColumn {
  key: string
  label: string
  type?: 'text' | 'number' | 'currency' | 'percentage'
  format?: (value: any) => string
}

export class ReportExporter {
  static async exportReport(report: ReportData, options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.exportToPDF(report, options)
      case 'excel':
        return this.exportToExcel(report, options)
      case 'csv':
        return this.exportToCSV(report, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }
  
  private static async exportToPDF(report: ReportData, options: ExportOptions): Promise<Blob> {
    // PDF export requires jsPDF library - placeholder implementation
    const content = this.generateTextContent(report)
    return new Blob([content], { type: 'application/pdf' })
  }
  
  private static generateTextContent(report: ReportData): string {
    let content = `${report.title}\n`
    if (report.subtitle) content += `${report.subtitle}\n`
    content += `Generated on ${format(report.date, 'MMMM d, yyyy')}\n\n`
    
    report.sections.forEach(section => {
      content += `${section.title}\n${'='.repeat(section.title.length)}\n\n`
      
      switch (section.type) {
        case 'text':
          content += `${section.data}\n\n`
          break
        case 'table':
          if (Array.isArray(section.data)) {
            section.data.forEach(row => {
              content += `${JSON.stringify(row)}\n`
            })
          }
          content += '\n'
          break
        default:
          content += `${JSON.stringify(section.data)}\n\n`
      }
    })
    
    return content
  }
  
  private static async exportToExcel(report: ReportData, options: ExportOptions): Promise<Blob> {
    // Excel export requires xlsx library - placeholder implementation
    const content = this.generateTextContent(report)
    return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }
  
  private static async exportToCSV(report: ReportData, options: ExportOptions): Promise<Blob> {
    let csvContent = ''
    
    // Header
    csvContent += `"${report.title}"\n`
    csvContent += `"Generated on ${format(report.date, 'MMMM d, yyyy')}"\n\n`
    
    // Sections
    report.sections.forEach(section => {
      if (section.type === 'table' && section.data.length > 0) {
        csvContent += `"${section.title}"\n`
        
        // Headers
        const headers = section.columns?.map(col => col.label) || Object.keys(section.data[0])
        csvContent += headers.map(h => `"${h}"`).join(',') + '\n'
        
        // Data
        section.data.forEach(row => {
          const values = section.columns 
            ? section.columns.map(col => {
                const value = col.format ? col.format(row[col.key]) : row[col.key]
                return `"${String(value || '').replace(/"/g, '""')}"`
              })
            : Object.values(row).map(v => `"${String(v || '').replace(/"/g, '""')}"`)
          
          csvContent += values.join(',') + '\n'
        })
        
        csvContent += '\n'
      }
    })
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  }
  
  static downloadFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Format helpers
export const formatters = {
  currency: (value: number) => `$${value.toFixed(2)}`,
  percentage: (value: number) => `${(value * 100).toFixed(2)}%`,
  number: (value: number) => value.toLocaleString(),
  date: (value: Date | string) => format(new Date(value), 'MMM d, yyyy'),
  datetime: (value: Date | string) => format(new Date(value), 'MMM d, yyyy h:mm a')
}