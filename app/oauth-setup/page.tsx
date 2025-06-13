'use client'

import React, { useState } from 'react'
import { FacebookOAuthFlow } from '@/components/facebook-oauth-flow'
import { MetaStyleDashboard } from '@/components/meta-style-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeft, Settings, Search } from 'lucide-react'
import Link from 'next/link'

export default function OAuthSetupPage() {
  const [oauthData, setOauthData] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [showDashboard, setShowDashboard] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Meta Ads Dashboard Setup
          </h1>
          <p className="text-gray-300">
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
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Select Ad Account</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose which ad account you want to manage ({oauthData.adAccounts.length} accounts)
                </CardDescription>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {oauthData.adAccounts
                      .filter((account: any) => 
                        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        account.id.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((account: any) => (
                        <Button
                          key={account.id}
                          variant="outline"
                          className="w-full justify-start bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                          onClick={() => handleAccountSelect(account.id)}
                        >
                          <div className="text-left">
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-gray-400">
                              {account.id} • Status: {account.account_status}
                              {account.account_status === 1 && ' (Active)'}
                              {account.account_status === 2 && ' (Disabled)'}
                              {account.account_status === 101 && ' (Closed)'}
                            </div>
                          </div>
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
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