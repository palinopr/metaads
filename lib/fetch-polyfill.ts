// Polyfill for fetch in Node.js environments
// Railway sometimes has issues with native fetch

let fetchImplementation: typeof fetch;

if (typeof globalThis.fetch === 'undefined') {
  console.log('Native fetch not available, using node-fetch');
  // This will be handled by Next.js built-in polyfills
  fetchImplementation = fetch;
} else {
  fetchImplementation = globalThis.fetch;
}

// Wrapper to ensure fetch works correctly
export async function safeFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  try {
    // For Railway, sometimes we need to explicitly bind fetch to globalThis
    const boundFetch = fetchImplementation.bind(globalThis);
    return await boundFetch(url, init);
  } catch (error) {
    console.error('Fetch error:', error);
    // Fallback: try using native fetch directly
    if (typeof fetch !== 'undefined') {
      return await fetch(url, init);
    }
    throw error;
  }
}

// Replace global fetch with our safe version in server environment
if (typeof window === 'undefined') {
  (globalThis as any).fetch = safeFetch;
}