import { NextRequest, NextResponse } from 'next/server'
import { MetaAPIClient } from '@/lib/meta-api-client'
import { AdSetAndAdAPI } from '@/lib/meta-api-adsets'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  const testAccountId = 'act_787610255314938'
  const testToken = 'EAATKZBg465ucBO0cXTZAsampletoken' // Fake token for validation test
  
  const results: any = {
    accountId: testAccountId,
    validation: {}
  }
  
  // Test regex directly
  const regex = /^act_\d+$/
  results.validation.regexTest = {
    pattern: regex.toString(),
    matches: regex.test(testAccountId),
    accountId: testAccountId
  }
  
  // Test zod schema
  try {
    const AdAccountIdSchema = z.string().regex(/^act_\d+$/, 'Ad Account ID must start with "act_" followed by numbers')
    const validated = AdAccountIdSchema.parse(testAccountId)
    results.validation.zodTest = {
      success: true,
      validated
    }
  } catch (error: any) {
    results.validation.zodTest = {
      success: false,
      error: error.message
    }
  }
  
  // Test MetaAPIClient creation
  try {
    const client = new MetaAPIClient(testToken, testAccountId, false)
    results.validation.clientCreation = {
      success: true,
      message: 'Client created successfully'
    }
  } catch (error: any) {
    results.validation.clientCreation = {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
  
  // Test AdSetAndAdAPI creation
  try {
    const adSetClient = new AdSetAndAdAPI(testToken, testAccountId, false)
    results.validation.adSetClientCreation = {
      success: true,
      message: 'AdSet client created successfully'
    }
  } catch (error: any) {
    results.validation.adSetClientCreation = {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
  
  return NextResponse.json(results)
}