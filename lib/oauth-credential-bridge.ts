// Bridge between OAuth flow and CredentialManager
import { CredentialManager, type Credentials } from './credential-manager'

export class OAuthCredentialBridge {
  static async syncFromOAuth(): Promise<boolean> {
    try {
      // Check if we have OAuth credentials
      const response = await fetch('/api/oauth/status')
      const data = await response.json()
      
      if (data.authenticated && data.token && data.selectedAccount) {
        // Save OAuth credentials to CredentialManager format
        const credentials: Credentials = {
          accessToken: data.token,
          adAccountId: data.selectedAccount
        }
        
        // Save to CredentialManager (which the dashboard uses)
        const saved = await CredentialManager.save(credentials, true)
        console.log('OAuth credentials synced to CredentialManager:', saved)
        return saved
      }
      
      return false
    } catch (error) {
      console.error('Failed to sync OAuth credentials:', error)
      return false
    }
  }
  
  static async checkAndSync(): Promise<Credentials | null> {
    // First try to load from CredentialManager
    const existing = await CredentialManager.load()
    if (existing) {
      return existing
    }
    
    // If not found, try to sync from OAuth
    const synced = await this.syncFromOAuth()
    if (synced) {
      return await CredentialManager.load()
    }
    
    return null
  }
}