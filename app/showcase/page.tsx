"use client"

import { PlatformEnhancements } from "@/components/platform-enhancements"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home } from "lucide-react"
import Link from "next/link"

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <PlatformEnhancements />
        
        {/* CTA Section */}
        <div className="mt-12 text-center pb-12">
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Ad Performance?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join industry leaders using our platform to achieve unprecedented ROI. 
            Our AI-powered features and automation save time while maximizing results.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                Get Started Now
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}