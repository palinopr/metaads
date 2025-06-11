'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, BarChart3, Users, FileText, Shield, 
  TrendingUp, Target, ArrowRight, Zap 
} from 'lucide-react'

export function PortfolioNavigation() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-blue-500" />
          Multi-Account Portfolio Manager
          <Badge variant="secondary" className="ml-2">NEW</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Comprehensive agency and enterprise-level account management with advanced analytics, 
            permissions, and cross-account operations.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-green-500" />
              Cross-Account Analytics
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              Account Grouping & Labels
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-purple-500" />
              Consolidated Reporting
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-orange-500" />
              Permission Management
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              Bulk Operations
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-red-500" />
              Portfolio Performance
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Link href="/portfolio">
              <Button className="gap-2">
                <Building2 className="h-4 w-4" />
                Open Portfolio Manager
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}