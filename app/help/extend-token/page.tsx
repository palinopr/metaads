'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExternalLink, Key, AlertCircle, Clock, Copy } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ExtendTokenHelpPage() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItem(item)
    setTimeout(() => setCopiedItem(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">How to Extend Your Facebook Access Token</h1>
          <p className="text-gray-400">
            Facebook access tokens expire after about 60 days. Here's how to extend them to last longer.
          </p>
        </div>

        {/* Quick Action */}
        <Alert className="bg-yellow-900/20 border-yellow-700 text-yellow-300">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Need to extend your token now?</span>
            <Link href="/settings/token">
              <Button size="sm" className="ml-4 bg-yellow-600 hover:bg-yellow-700 text-white">
                <Key className="w-3 h-3 mr-1" />
                Go to Token Manager
              </Button>
            </Link>
          </AlertDescription>
        </Alert>

        {/* Steps */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Step-by-Step Guide</CardTitle>
            <CardDescription>Follow these steps to get a long-lived access token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
                Get Your Short-Lived Token
              </h3>
              <p className="text-gray-300 ml-9">
                Go to the Facebook Graph API Explorer and generate a new access token with the required permissions.
              </p>
              <div className="ml-9 space-y-2">
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  Open Graph API Explorer
                  <ExternalLink className="w-4 h-4" />
                </a>
                <div className="bg-gray-700 p-3 rounded text-sm space-y-1">
                  <p className="font-medium">Required Permissions:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>ads_read</li>
                    <li>ads_management</li>
                    <li>business_management</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                Get Your App Secret
              </h3>
              <p className="text-gray-300 ml-9">
                You'll need your Facebook App's secret key. You can find this in your app settings.
              </p>
              <div className="ml-9 space-y-2">
                <a
                  href="https://developers.facebook.com/apps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  Go to Facebook Apps
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Alert className="bg-gray-700 border-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your app secret is sensitive. Never share it publicly or commit it to version control.
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                Use the Token Extension Tool
              </h3>
              <p className="text-gray-300 ml-9">
                Navigate to our Token Manager and enter your short-lived token and app secret.
              </p>
              <div className="ml-9">
                <Link href="/settings/token">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Key className="w-4 h-4 mr-2" />
                    Open Token Manager
                  </Button>
                </Link>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
                Save Your Extended Token
              </h3>
              <p className="text-gray-300 ml-9">
                Once extended, your token will last for about 60 days. Click "Update Dashboard Credentials" to save it.
              </p>
              <div className="ml-9">
                <div className="bg-gray-700 p-3 rounded text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">
                    Extended tokens typically last 60 days, but can sometimes last longer.
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Methods */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Alternative Method: Using cURL</CardTitle>
            <CardDescription>For developers who prefer command line</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-gray-300">
                You can also extend your token using this cURL command:
              </p>
              <div className="bg-gray-900 p-4 rounded font-mono text-sm relative">
                <code className="text-green-400 break-all">
                  curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(
                    'curl -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"',
                    'curl'
                  )}
                >
                  {copiedItem === 'curl' ? 'Copied!' : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-400">
                Replace YOUR_APP_ID, YOUR_APP_SECRET, and YOUR_SHORT_TOKEN with your actual values.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">Token Still Expiring Quickly?</h4>
              <p className="text-gray-300 text-sm">
                Make sure you're using the extended token, not the original short-lived one. 
                The extended token is usually much longer in length.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">Getting "Invalid App Secret" Error?</h4>
              <p className="text-gray-300 text-sm">
                Double-check that you're using the app secret from the same app that generated the token. 
                The app ID in the token must match your app.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-400 mb-1">Need a Token That Never Expires?</h4>
              <p className="text-gray-300 text-sm">
                Consider using System User tokens for production apps. They don't expire but require 
                Business Manager setup.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-gray-500 text-sm">
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}