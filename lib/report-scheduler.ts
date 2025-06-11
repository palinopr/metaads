import { format, addDays, addWeeks, addMonths, isWeekend } from 'date-fns'
import { notificationManager } from './notification-manager'

export interface ScheduledReport {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  customCron?: string
  timezone: string
  sendTime: string // HH:mm format
  businessDaysOnly: boolean
  recipients: string[]
  template: string
  enabled: boolean
  lastRun?: Date
  nextRun: Date
}

export interface ScheduleOptions {
  timezone?: string
  businessDaysOnly?: boolean
  sendTime?: string // HH:mm format
}

export class ReportScheduler {
  private static instance: ReportScheduler
  private schedules: Map<string, ScheduledReport> = new Map()
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  
  private constructor() {
    this.loadSchedules()
    this.startScheduler()
  }
  
  static getInstance(): ReportScheduler {
    if (!ReportScheduler.instance) {
      ReportScheduler.instance = new ReportScheduler()
    }
    return ReportScheduler.instance
  }
  
  private loadSchedules() {
    const saved = localStorage.getItem('report-schedules')
    if (saved) {
      const schedules = JSON.parse(saved) as ScheduledReport[]
      schedules.forEach(schedule => {
        schedule.nextRun = new Date(schedule.nextRun)
        schedule.lastRun = schedule.lastRun ? new Date(schedule.lastRun) : undefined
        this.schedules.set(schedule.id, schedule)
      })
    }
  }
  
  private saveSchedules() {
    const schedules = Array.from(this.schedules.values())
    localStorage.setItem('report-schedules', JSON.stringify(schedules))
  }
  
  addSchedule(schedule: ScheduledReport) {
    this.schedules.set(schedule.id, schedule)
    this.saveSchedules()
    this.scheduleNext(schedule.id)
  }
  
  removeSchedule(id: string) {
    this.schedules.delete(id)
    this.clearSchedule(id)
    this.saveSchedules()
  }
  
  updateSchedule(id: string, updates: Partial<ScheduledReport>) {
    const schedule = this.schedules.get(id)
    if (schedule) {
      const updated = { ...schedule, ...updates }
      this.schedules.set(id, updated)
      this.saveSchedules()
      this.clearSchedule(id)
      this.scheduleNext(id)
    }
  }
  
  private startScheduler() {
    // Check every minute for reports to run
    setInterval(() => {
      this.checkPendingReports()
    }, 60000)
  }
  
  private checkPendingReports() {
    const now = new Date()
    
    this.schedules.forEach((schedule) => {
      if (!schedule.enabled) return
      
      // Check if it's time to run this report
      if (now >= schedule.nextRun) {
        this.runReport(schedule.id)
      }
    })
  }
  
  private async runReport(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId)
    if (!schedule) return
    
    try {
      // Skip weekends if business days only
      if (schedule.businessDaysOnly && isWeekend(new Date())) {
        this.scheduleNext(scheduleId)
        return
      }
      
      // Generate and send report
      await this.generateAndSendReport(schedule)\n      \n      // Update last run and schedule next run\n      const now = new Date()\n      schedule.lastRun = now\n      schedule.nextRun = this.calculateNextRun(schedule, now)\n      \n      this.schedules.set(scheduleId, schedule)\n      this.saveSchedules()\n      \n      // Notify about successful report generation\n      await notificationManager.sendNotification(\n        'Report Generated',\n        `${schedule.name} has been generated and sent successfully.`,\n        'info'\n      )\n      \n    } catch (error) {\n      console.error('Failed to run scheduled report:', error)\n      \n      await notificationManager.sendNotification(\n        'Report Failed',\n        `Failed to generate ${schedule.name}. Please check the report configuration.`,\n        'warning'\n      )\n    }\n  }\n  \n  private async generateAndSendReport(schedule: ScheduledReport) {\n    // This would integrate with your actual report generation logic\n    console.log('Generating report:', schedule.name)\n    \n    // Mock report generation\n    const reportData = {\n      name: schedule.name,\n      generatedAt: new Date(),\n      recipients: schedule.recipients,\n      template: schedule.template\n    }\n    \n    // Send to recipients (this would use your email service)\n    console.log('Sending report to:', schedule.recipients)\n    \n    return reportData\n  }\n  \n  private scheduleNext(scheduleId: string) {\n    const schedule = this.schedules.get(scheduleId)\n    if (!schedule) return\n    \n    const nextRun = this.calculateNextRun(schedule)\n    schedule.nextRun = nextRun\n    this.schedules.set(scheduleId, schedule)\n    this.saveSchedules()\n  }\n  \n  private clearSchedule(id: string) {\n    const interval = this.intervals.get(id)\n    if (interval) {\n      clearTimeout(interval)\n      this.intervals.delete(id)\n    }\n  }\n  \n  calculateNextRun(schedule: ScheduledReport, from?: Date): Date {\n    const baseDate = from || new Date()\n    const [hours, minutes] = schedule.sendTime.split(':').map(Number)\n    \n    let nextRun: Date\n    \n    switch (schedule.frequency) {\n      case 'daily':\n        nextRun = addDays(baseDate, 1)\n        break\n        \n      case 'weekly':\n        nextRun = addWeeks(baseDate, 1)\n        break\n        \n      case 'monthly':\n        nextRun = addMonths(baseDate, 1)\n        break\n        \n      case 'custom':\n        // Simple cron-like parsing (this is a basic implementation)\n        nextRun = this.parseCustomSchedule(schedule.customCron || '0 9 * * 1', baseDate)\n        break\n        \n      default:\n        nextRun = addDays(baseDate, 1)\n    }\n    \n    // Set the specific time\n    nextRun.setHours(hours, minutes, 0, 0)\n    \n    // Skip weekends if business days only\n    if (schedule.businessDaysOnly) {\n      while (isWeekend(nextRun)) {\n        nextRun = addDays(nextRun, 1)\n      }\n    }\n    \n    return nextRun\n  }\n  \n  private parseCustomSchedule(cronExpression: string, from: Date): Date {\n    // Basic cron parsing - in production, use a proper cron library\n    // Format: minute hour day month dayOfWeek\n    const parts = cronExpression.split(' ')\n    \n    if (parts.length !== 5) {\n      // Fallback to daily\n      return addDays(from, 1)\n    }\n    \n    const [minute, hour, day, month, dayOfWeek] = parts\n    \n    // For now, just handle simple cases\n    if (dayOfWeek === '1') { // Monday\n      const nextMonday = addWeeks(from, 1)\n      nextMonday.setDay(1) // Set to Monday\n      return nextMonday\n    }\n    \n    if (day === '1') { // First day of month\n      return addMonths(from, 1)\n    }\n    \n    // Default to daily\n    return addDays(from, 1)\n  }\n  \n  getSchedules(): ScheduledReport[] {\n    return Array.from(this.schedules.values())\n  }\n  \n  getSchedule(id: string): ScheduledReport | undefined {\n    return this.schedules.get(id)\n  }\n  \n  getUpcomingReports(limit = 10): ScheduledReport[] {\n    return Array.from(this.schedules.values())\n      .filter(s => s.enabled)\n      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())\n      .slice(0, limit)\n  }\n  \n  // Manual trigger for testing\n  async triggerReport(id: string) {\n    await this.runReport(id)\n  }\n}\n\n// Utility functions for schedule management\nexport const scheduleUtils = {\n  formatNextRun: (date: Date) => {\n    return format(date, 'MMM d, yyyy \\a\\t h:mm a')\n  },\n  \n  getTimeUntilNextRun: (date: Date) => {\n    const now = new Date()\n    const diff = date.getTime() - now.getTime()\n    \n    if (diff < 0) return 'Overdue'\n    \n    const days = Math.floor(diff / (24 * 60 * 60 * 1000))\n    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))\n    \n    if (days > 0) {\n      return `${days} day${days === 1 ? '' : 's'}`\n    } else if (hours > 0) {\n      return `${hours} hour${hours === 1 ? '' : 's'}`\n    } else {\n      return 'Less than 1 hour'\n    }\n  },\n  \n  createCronExpression: (frequency: string, hour: number, minute: number, dayOfWeek?: number) => {\n    switch (frequency) {\n      case 'daily':\n        return `${minute} ${hour} * * *`\n      case 'weekly':\n        return `${minute} ${hour} * * ${dayOfWeek || 1}`\n      case 'monthly':\n        return `${minute} ${hour} 1 * *`\n      default:\n        return `${minute} ${hour} * * *`\n    }\n  }\n}\n\nexport const reportScheduler = ReportScheduler.getInstance()"}, {"old_string": "import { format, addDays, addWeeks, addMonths, isWeekend, isSameHour } from 'date-fns'", "new_string": "import { format, addDays, addWeeks, addMonths, isWeekend } from 'date-fns'"}]