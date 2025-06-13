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
        // Ensure account ID has proper format
        const accountId = data.selectedAccount.startsWith('act_') 
          ? data.selectedAccount 
          : `act_${data.selectedAccount}`
          
        const credentials: Credentials = {
          accessToken: data.token,
          adAccountId: accountId
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
  
  static async syncToOAuth(credentials: Credentials): Promise<boolean> {
    try {
      // Sync credentials from localStorage to OAuth cookies
      const response = await fetch('/api/oauth/fix-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: credentials.accessToken,
          adAccountId: credentials.adAccountId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        console.log('Credentials synced to OAuth cookies')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to sync to OAuth:', error)
      return false
    }
  }
  
  static async checkAndSync(): Promise<Credentials | null> {
    // First try to load from CredentialManager
    const existing = await CredentialManager.load()
    if (existing) {
      // Also sync to OAuth cookies to ensure consistency
      await this.syncToOAuth(existing)
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