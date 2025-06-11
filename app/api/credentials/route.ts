import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

// In-memory storage for demo (replace with database in production)
const credentialStore = new Map<string, {
  accessToken: string
  adAccountId: string
  userId: string
  createdAt: Date
  updatedAt: Date
}>()

// Schema for credential validation
const credentialSchema = z.object({
  accessToken: z.string().min(50),
  adAccountId: z.string().regex(/^act_\d+$/),
  userId: z.string().optional()
})

// Simple encryption for demo (use proper encryption in production)
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key', 'utf8').slice(0, 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

function decrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key', 'utf8').slice(0, 32)
  const [ivHex, encrypted] = text.split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

// Generate a simple user ID based on IP (in production, use proper auth)
function getUserId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'anonymous'
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = credentialSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid credentials format', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { accessToken, adAccountId } = validation.data
    const userId = validation.data.userId || getUserId(request)
    
    // Encrypt the access token before storing
    const encryptedToken = encrypt(accessToken)
    
    // Store credentials
    credentialStore.set(userId, {
      accessToken: encryptedToken,
      adAccountId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    console.log(`Credentials saved for user: ${userId}`)
    
    return NextResponse.json({
      success: true,
      userId,
      message: 'Credentials saved successfully'
    })
  } catch (error) {
    console.error('Error saving credentials:', error)
    return NextResponse.json(
      { error: 'Failed to save credentials' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || getUserId(request)
    const credentials = credentialStore.get(userId)
    
    if (!credentials) {
      // Check environment variables as fallback
      const envToken = process.env.NEXT_PUBLIC_META_ACCESS_TOKEN
      const envAccountId = process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID
      
      if (envToken && envAccountId) {
        return NextResponse.json({
          success: true,
          credentials: {
            accessToken: envToken,
            adAccountId: envAccountId,
            source: 'environment'
          }
        })
      }
      
      return NextResponse.json(
        { error: 'No credentials found' },
        { status: 404 }
      )
    }
    
    // Decrypt the access token
    const decryptedToken = decrypt(credentials.accessToken)
    
    return NextResponse.json({
      success: true,
      credentials: {
        accessToken: decryptedToken,
        adAccountId: credentials.adAccountId,
        userId: credentials.userId,
        updatedAt: credentials.updatedAt,
        source: 'storage'
      }
    })
  } catch (error) {
    console.error('Error loading credentials:', error)
    return NextResponse.json(
      { error: 'Failed to load credentials' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || getUserId(request)
    const deleted = credentialStore.delete(userId)
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'No credentials found to delete' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Credentials deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting credentials:', error)
    return NextResponse.json(
      { error: 'Failed to delete credentials' },
      { status: 500 }
    )
  }
}