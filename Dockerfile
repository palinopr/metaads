# Multi-stage Docker build for optimized production deployment
# Security hardened with non-root user and minimal attack surface

# Base stage with security updates
FROM node:20-alpine AS base
LABEL maintainer="DevOps Team <devops@metaads.com>"
LABEL org.opencontainers.image.source="https://github.com/metaads/dashboard"
LABEL org.opencontainers.image.description="Meta Ads Dashboard - Enterprise Analytics Platform"

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory and user
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Dependencies stage - optimized for caching
FROM base AS deps
# Copy package files first for better Docker layer caching
COPY package.json pnpm-lock.yaml* ./
COPY .npmrc* ./

# Enable pnpm and install dependencies with production optimizations
RUN corepack enable pnpm && \
    pnpm config set store-dir ~/.pnpm-store && \
    pnpm config set network-timeout 600000 && \
    pnpm install --no-frozen-lockfile --production=false --prefer-offline && \
    pnpm store prune

# Development dependencies for building
FROM deps AS dev-deps
RUN pnpm install --no-frozen-lockfile --prefer-offline

# Build stage with optimizations
FROM base AS builder
WORKDIR /app

# Copy installed dependencies
COPY --from=dev-deps /app/node_modules ./node_modules
COPY --from=dev-deps /root/.pnpm-store /root/.pnpm-store

# Copy source code
COPY . .

# Security: Remove sensitive files that shouldn't be in production
RUN rm -f .env.local .env.development .env.test

# Build application with optimizations
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN corepack enable pnpm && \
    pnpm run build && \
    pnpm prune --production

# Production dependencies only
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && \
    pnpm config set network-timeout 600000 && \
    pnpm install --no-frozen-lockfile --production --prefer-offline && \
    pnpm store prune

# Final production stage - minimal and secure
FROM base AS runner
WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--enable-source-maps --max-old-space-size=2048"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install production dependencies
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create necessary directories with correct permissions
RUN mkdir -p .next/cache logs tmp && \
    chown -R nextjs:nodejs .next logs tmp && \
    chmod -R 755 .next logs tmp

# Security: Remove package managers and unnecessary files
RUN npm uninstall -g npm && \
    apk del --no-cache && \
    rm -rf /root/.npm /root/.pnpm-store /tmp/* /var/tmp/*

# Health check script
COPY --chown=nextjs:nodejs <<EOF /app/healthcheck.js
const http = require('http');
const options = {
  host: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  timeout: 2000
};
const request = http.request(options, (res) => {
  console.log('Health check status:', res.statusCode);
  process.exit(res.statusCode === 200 ? 0 : 1);
});
request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});
request.end();
EOF

# Configure health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node /app/healthcheck.js

# Switch to non-root user for security
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start application with optimized settings
CMD ["node", "server.js"]

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Metadata labels
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.title="Meta Ads Dashboard"
LABEL org.opencontainers.image.vendor="MetaAds Inc."