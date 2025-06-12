/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: false,
    workerThreads: false,
    cpus: 1,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['graph.facebook.com'],
  },
  // Disable static optimization for specific pages
  staticPageGenerationTimeout: 0,
  // Optimize for Railway deployment
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  // Ensure all pages are included in build
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  
  // Add cache headers to prevent stale content
  async headers() {
    return [
      {
        // For Next.js static assets - short cache with revalidation
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate', // 1 hour cache
          },
        ],
      },
      {
        // For HTML pages - no cache
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // For images - longer cache
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable', // 30 days
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig