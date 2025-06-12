'use client'

import React, { useState } from 'react'
import { FacebookOAuthFlow } from '@/components/facebook-oauth-flow'
import { MetaStyleDashboard } from '@/components/meta-style-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Settings } from 'lucide-react'
import Link from 'next/link'

export default function OAuthSetupPage() {
  const [oauthData, setOauthData] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(false)

  const handleOAuthSuccess = (data: any) => {
    setOauthData(data)
    if (data.adAccounts && data.adAccounts.length === 1) {
      // Auto-select if only one account
      setSelectedAccount(data.adAccounts[0].id)
      setShowDashboard(true)
    }
  }

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId)
    setShowDashboard(true)
  }

  if (showDashboard && oauthData && selectedAccount) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <Button 
            variant="outline" 
            onClick={() => setShowDashboard(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Setup
          </Button>
        </div>
        <MetaStyleDashboard 
          credentials={{
            accessToken: oauthData.token,
            adAccountId: selectedAccount
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meta Ads Dashboard Setup
          </h1>
          <p className="text-gray-600">
            Connect your Facebook account to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <FacebookOAuthFlow 
              onSuccess={handleOAuthSuccess}
              onError={(error) => console.error('OAuth error:', error)}
            />
          </div>

          {oauthData && oauthData.adAccounts && (
            <Card>
              <CardHeader>
                <CardTitle>Select Ad Account</CardTitle>
                <CardDescription>
                  Choose which ad account you want to manage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {oauthData.adAccounts.map((account: any) => (
                  <Button
                    key={account.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleAccountSelect(account.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-500">
                        {account.id} • {account.account_status}
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Use Manual Token Setup Instead
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}