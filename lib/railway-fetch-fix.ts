// Fix for Railway fetch issues with Meta API
import https from 'https'
import { URL } from 'url'

export async function railwayFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // First try native fetch
  try {
    return await fetch(url, options)
  } catch (fetchError) {
    console.log('Native fetch failed, using https module fallback')
    
    // Fallback to https module
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      
      const httpsOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; MetaAds/1.0)',
          ...(options.headers as any || {})
        }
      }
      
      const req = https.request(httpsOptions, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          // Create a Response-like object
          const response = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            json: async () => JSON.parse(data),
            text: async () => data,
            blob: async () => Buffer.from(data),
            arrayBuffer: async () => Buffer.from(data).buffer,
            clone: () => response,
          } as Response
          
          resolve(response)
        })
      })
      
      req.on('error', (error) => {
        reject(error)
      })
      
      if (options.body) {
        req.write(options.body)
      }
      
      req.end()
    })
  }
}