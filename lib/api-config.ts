// API Configuration - temporary fix for 403 errors
export const API_CONFIG = {
  // Use the working test endpoint temporarily
  META_ENDPOINT: '/api/meta-test',
  
  // Original endpoint (blocked by security)
  // META_ENDPOINT: '/api/meta',
} as const

export const getMetaEndpoint = () => API_CONFIG.META_ENDPOINT