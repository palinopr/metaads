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
  // Skip static generation for pages that require runtime data
  generateStaticParams: false,
  // Disable static optimization for specific pages
  staticPageGenerationTimeout: 0,
  // Optimize for Railway deployment
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig