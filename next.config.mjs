/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable strict mode to prevent double renders
  reactStrictMode: false,
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization
    unoptimized: false,
    // Optimize loading with proper sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Use webp format when possible
    formats: ['image/webp'],
  },
  
  // Performance optimizations
  experimental: {
    workerThreads: false,
    cpus: 1,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', '@radix-ui/react-accordion', '@radix-ui/react-dialog'],
    // Optimize CSS
    optimizeCss: true,
    // Skip static generation for problematic pages
    isrMemoryCacheSize: 0,
  },
  
  // Optimize compilation
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Disable problematic optimizations for now
    // config.optimization.usedExports = true
    // config.optimization.sideEffects = false
    
    // Split chunks optimally
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate large libraries
          recharts: {
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            name: 'recharts',
            priority: 30,
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'radix-ui',
            priority: 30,
            chunks: 'all',
          },
        },
      }
      
      // Minimize bundle size
      config.optimization.minimize = true
    }
    
    return config
  },
  
  // Handle errors gracefully
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Custom server configuration
  serverRuntimeConfig: {
    maxRequestTimeout: 30000,
  },
  
  // Enable SWC minification
  swcMinify: true,

  // Redirects for common routes
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/main',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard-main',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },

  // Handle missing assets and resources
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: '/api/404', // Will be handled by middleware
        },
      ],
    }
  },

  // PWA configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
              "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com https://cdn.jsdelivr.net https://unpkg.com https://*.cloudinary.com https://*.amazonaws.com https://*.cloudfront.net",
              "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com",
              "connect-src 'self' https://graph.facebook.com https://*.facebook.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com wss: ws:",
              "media-src 'self' data: blob:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'"
            ].join('; '),
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
              "img-src 'self' data: https: blob: https://*.googleapis.com https://*.gstatic.com https://cdn.jsdelivr.net https://unpkg.com https://*.cloudinary.com https://*.amazonaws.com https://*.cloudfront.net",
              "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://unpkg.com",
              "connect-src 'self' https://graph.facebook.com https://*.facebook.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
              "media-src 'self' data: blob:",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'"
            ].join('; '),
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=180, s-maxage=180, stale-while-revalidate=180',
          },
        ],
      },
    ]
  },

  // Enable service worker in production
  env: {
    NEXT_PUBLIC_ENABLE_SW: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },
};

export default nextConfig;
