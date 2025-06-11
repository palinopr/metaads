/**
 * Agent 6: Performance Agent
 * Optimizes application performance and resource usage
 */

import { BaseAgent, Task } from './base-agent';

export class PerformanceAgent extends BaseAgent {
  constructor() {
    super('Performance');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'perf-1',
        name: 'Implement code splitting',
        description: 'Reduce initial bundle size',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'perf-2',
        name: 'Optimize rendering',
        description: 'Reduce re-renders and improve React performance',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'perf-3',
        name: 'Add resource hints',
        description: 'Preload, prefetch, and preconnect',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'perf-4',
        name: 'Implement image optimization',
        description: 'Lazy loading and format optimization',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'perf-5',
        name: 'Create performance monitoring',
        description: 'Real user monitoring (RUM)',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting performance optimization...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'perf-1':
        await this.implementCodeSplitting();
        break;
      case 'perf-2':
        await this.optimizeRendering();
        break;
      case 'perf-3':
        await this.addResourceHints();
        break;
      case 'perf-4':
        await this.implementImageOptimization();
        break;
      case 'perf-5':
        await this.createPerformanceMonitoring();
        break;
    }
  }

  private async implementCodeSplitting() {
    // Create dynamic imports wrapper
    await this.writeFile('lib/performance/dynamic-imports.ts', `
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

interface DynamicOptions {
  loading?: ComponentType;
  ssr?: boolean;
  suspense?: boolean;
}

// Helper for creating dynamic imports with consistent loading states
export function createDynamicComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: DynamicOptions = {}
) {
  return dynamic(importFn, {
    loading: options.loading || (() => <div>Loading...</div>),
    ssr: options.ssr ?? true,
    suspense: options.suspense ?? false,
  });
}

// Pre-configured dynamic imports for heavy components
export const DynamicCharts = createDynamicComponent(
  () => import('@/components/features/charts'),
  { ssr: false }
);

export const DynamicAIInsights = createDynamicComponent(
  () => import('@/components/features/ai-insights-panel'),
  { suspense: true }
);

export const DynamicCampaignDetail = createDynamicComponent(
  () => import('@/components/features/campaign-detail-view')
);

export const DynamicReports = createDynamicComponent(
  () => import('@/components/features/reports-generator'),
  { ssr: false }
);

// Route-based code splitting
export const routeComponents = {
  '/dashboard': createDynamicComponent(() => import('@/app/dashboard/page')),
  '/analytics': createDynamicComponent(() => import('@/app/analytics/page')),
  '/reports': createDynamicComponent(() => import('@/app/reports/page')),
  '/settings': createDynamicComponent(() => import('@/app/settings/page')),
};

// Utility for preloading components
export function preloadComponent(component: any) {
  if (typeof component.preload === 'function') {
    component.preload();
  }
}

// Intersection observer for automatic preloading
export function useComponentPreloader(components: any[]) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const component = components.find(c => c.id === entry.target.id);
            if (component) {
              preloadComponent(component);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observe trigger elements
    components.forEach(component => {
      const element = document.getElementById(component.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [components]);
}
`);

    // Create bundle analyzer config
    await this.writeFile('next.config.performance.mjs', `
import { withSentryConfig } from '@sentry/nextjs';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Configure module IDs for better caching
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Use deterministic module IDs
      config.optimization.moduleIds = 'deterministic';
      
      // Split chunks for better caching
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
          // Common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI components
          ui: {
            name: 'ui',
            test: /components\\/ui/,
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*', 'recharts'],
  },
};

export default bundleAnalyzer(nextConfig);
`);

    this.log('Code splitting implemented');
  }

  private async optimizeRendering() {
    // Create React optimization hooks
    await this.writeFile('hooks/use-performance.ts', `
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Debounced value hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        lastRun.current = now;
        return callback(...args);
      } else {
        clearTimeout(timeout.current);
        timeout.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;
}

// Lazy state initialization
export function useLazyState<T>(
  initializer: () => T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    // Only run initializer once
    return initializer();
  });

  return [state, setState];
}

// Virtual rendering hook
export function useVirtualization<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = useMemo(
    () => Math.max(0, Math.floor(scrollTop / itemHeight) - overscan),
    [scrollTop, itemHeight, overscan]
  );

  const endIndex = useMemo(
    () =>
      Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      ),
    [scrollTop, containerHeight, itemHeight, overscan, items.length]
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// Render optimization wrapper
export function withRenderOptimization<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, propsAreEqual || undefined);
}

// Progressive enhancement hook
export function useProgressiveEnhancement(feature: string): boolean {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check feature support
    switch (feature) {
      case 'intersection-observer':
        setIsSupported('IntersectionObserver' in window);
        break;
      case 'web-workers':
        setIsSupported('Worker' in window);
        break;
      case 'service-worker':
        setIsSupported('serviceWorker' in navigator);
        break;
      case 'indexed-db':
        setIsSupported('indexedDB' in window);
        break;
      default:
        setIsSupported(false);
    }
  }, [feature]);

  return isSupported;
}

// Performance observer hook
export function usePerformanceObserver(
  callback: (entries: PerformanceEntry[]) => void,
  options: PerformanceObserverInit
) {
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });

    observer.observe(options);

    return () => observer.disconnect();
  }, [callback, options]);
}
`);

    // Create memoization utilities
    await this.writeFile('lib/performance/memoization.ts', `
import { DependencyList, useCallback, useMemo, useRef } from 'react';

// Deep equality check
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

// Memoization with custom equality
export function useMemoWithComparison<T>(
  factory: () => T,
  deps: DependencyList,
  isEqual: (a: DependencyList, b: DependencyList) => boolean = deepEqual
): T {
  const ref = useRef<{ deps: DependencyList; value: T }>();

  if (!ref.current || !isEqual(deps, ref.current.deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

// Stable callback reference
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    (...args: Parameters<T>) => callbackRef.current(...args),
    []
  ) as T;
}

// Computation cache
class ComputationCache<K, V> {
  private cache = new Map<string, { value: V; timestamp: number }>();
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge = 5000, maxSize = 100) {
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  get(key: K, compute: () => V): V {
    const keyStr = JSON.stringify(key);
    const cached = this.cache.get(keyStr);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached.value;
    }

    const value = compute();
    this.set(keyStr, value);
    return value;
  }

  private set(key: string, value: V) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      this.cache.delete(oldest[0]);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

// Hook for expensive computations
export function useComputationCache<K, V>(
  maxAge?: number,
  maxSize?: number
): ComputationCache<K, V> {
  const cacheRef = useRef<ComputationCache<K, V>>();

  if (!cacheRef.current) {
    cacheRef.current = new ComputationCache(maxAge, maxSize);
  }

  return cacheRef.current;
}

// Batch state updates
export function useBatchedState<T>(
  initialState: T
): [T, (updates: Partial<T>) => void] {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batchedSetState = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, 0);
  }, []);

  return [state, batchedSetState];
}
`);

    this.log('Rendering optimizations implemented');
  }

  private async addResourceHints() {
    await this.writeFile('lib/performance/resource-hints.tsx', `
import Head from 'next/head';
import { useEffect } from 'react';

interface ResourceHintsProps {
  preconnect?: string[];
  prefetch?: string[];
  preload?: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font' | 'document';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
  dns?: string[];
}

export function ResourceHints({
  preconnect = [],
  prefetch = [],
  preload = [],
  dns = []
}: ResourceHintsProps) {
  // Dynamic resource hints
  useEffect(() => {
    // Preconnect to critical origins
    const criticalOrigins = [
      'https://graph.facebook.com',
      'https://www.google-analytics.com',
      'https://fonts.googleapis.com'
    ];

    criticalOrigins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Prefetch next likely navigation
    const prefetchNextRoute = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const href = (entry.target as HTMLAnchorElement).href;
              const link = document.createElement('link');
              link.rel = 'prefetch';
              link.href = href;
              link.as = 'document';
              document.head.appendChild(link);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '50px' }
      );

      links.forEach(link => observer.observe(link));

      return () => observer.disconnect();
    };

    const cleanup = prefetchNextRoute();
    return cleanup;
  }, []);

  return (
    <Head>
      {/* DNS Prefetch */}
      {dns.map(domain => (
        <link key={domain} rel="dns-prefetch" href={domain} />
      ))}

      {/* Preconnect */}
      {preconnect.map(origin => (
        <link
          key={origin}
          rel="preconnect"
          href={origin}
          crossOrigin="anonymous"
        />
      ))}

      {/* Prefetch */}
      {prefetch.map(url => (
        <link key={url} rel="prefetch" href={url} as="fetch" />
      ))}

      {/* Preload */}
      {preload.map(resource => (
        <link
          key={resource.href}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
          crossOrigin={resource.crossOrigin}
        />
      ))}
    </Head>
  );
}

// Adaptive loading based on connection speed
export function useAdaptiveLoading() {
  const [connectionType, setConnectionType] = useState<
    'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  >('unknown');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionType = () => {
        const effectiveType = connection.effectiveType || 'unknown';
        setConnectionType(effectiveType);
      };

      updateConnectionType();
      connection.addEventListener('change', updateConnectionType);

      return () => {
        connection.removeEventListener('change', updateConnectionType);
      };
    }
  }, []);

  return {
    connectionType,
    shouldReduceData: connectionType === 'slow-2g' || connectionType === '2g',
    shouldPreload: connectionType === '4g',
    shouldLazyLoad: connectionType !== '4g'
  };
}

// Critical CSS inlining
export function CriticalCSS({ css }: { css: string }) {
  return (
    <Head>
      <style
        dangerouslySetInnerHTML={{ __html: css }}
        data-critical="true"
      />
    </Head>
  );
}

// Script loading optimization
export function OptimizedScript({
  src,
  strategy = 'afterInteractive',
  onLoad,
  ...props
}: {
  src: string;
  strategy?: 'beforeInteractive' | 'afterInteractive' | 'lazyOnload';
  onLoad?: () => void;
  [key: string]: any;
}) {
  useEffect(() => {
    if (strategy === 'lazyOnload') {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            if (onLoad) script.onload = onLoad;
            Object.keys(props).forEach(key => {
              script.setAttribute(key, props[key]);
            });
            document.body.appendChild(script);
            observer.disconnect();
          }
        },
        { rootMargin: '100px' }
      );

      // Observe a trigger element
      const trigger = document.getElementById('script-trigger');
      if (trigger) observer.observe(trigger);

      return () => observer.disconnect();
    }
  }, [src, strategy, onLoad, props]);

  if (strategy === 'beforeInteractive') {
    return (
      <Head>
        <script src={src} {...props} />
      </Head>
    );
  }

  return null;
}
`);

    this.log('Resource hints added');
  }

  private async implementImageOptimization() {
    await this.writeFile('components/common/optimized-image.tsx', `
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  sizes
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px',
  });

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...';

  // Determine if we should load the image
  const shouldLoad = priority || inView;

  // Fallback for error state
  if (error) {
    return (
      <div
        className={cn(
          'bg-muted flex items-center justify-center',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">
          Failed to load image
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      {shouldLoad && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{ objectFit }}
          sizes={sizes || \`(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw\`}
          onLoad={() => {
            setIsLoaded(true);
            onLoad?.();
          }}
          onError={() => setError(true)}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && !error && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            className
          )}
        />
      )}
    </div>
  );
}

// Picture element for art direction
export function ResponsivePicture({
  sources,
  alt,
  className,
  ...props
}: {
  sources: Array<{
    srcSet: string;
    media?: string;
    type?: string;
  }>;
  alt: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.srcSet}
          media={source.media}
          type={source.type}
        />
      ))}
      <img alt={alt} className={className} {...props} />
    </picture>
  );
}

// Background image optimization
export function OptimizedBackgroundImage({
  src,
  className,
  children,
  ...props
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '100px',
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (inView && !isLoaded) {
      const img = new window.Image();
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [inView, src, isLoaded]);

  return (
    <div
      ref={ref}
      className={cn('relative', className)}
      style={{
        backgroundImage: isLoaded ? \`url(\${src})\` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      {...props}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {children}
    </div>
  );
}

// Image gallery with virtualization
export function VirtualImageGallery({
  images,
  columns = 3,
  gap = 16,
  ...imageProps
}: {
  images: Array<{ src: string; alt: string }>;
  columns?: number;
  gap?: number;
  [key: string]: any;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px',
  });

  return (
    <div
      ref={ref}
      className="grid"
      style={{
        gridTemplateColumns: \`repeat(\${columns}, 1fr)\`,
        gap: \`\${gap}px\`,
      }}
    >
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          {...imageProps}
        />
      ))}
    </div>
  );
}
`);

    this.log('Image optimization implemented');
  }

  private async createPerformanceMonitoring() {
    await this.writeFile('lib/performance/monitoring.ts', `
interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  };

  private observers: Map<string, PerformanceObserver> = new Map();
  private listeners: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.measureTTFB();
    }
  }

  private initializeObservers() {
    // FCP Observer
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.notifyListeners();
          }
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
      this.observers.set('fcp', fcpObserver);
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.notifyListeners();
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', lcpObserver);
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            const fidEntry = entry as PerformanceEventTiming;
            this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
            this.notifyListeners();
          }
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', fidObserver);
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // CLS Observer
    try {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsEntries.push(entry);
            clsValue += (entry as any).value;
          }
        }
        this.metrics.cls = clsValue;
        this.notifyListeners();
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', clsObserver);
    } catch (e) {
      console.warn('CLS observer not supported');
    }

    // INP Observer
    try {
      let inpValue = 0;
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'event') {
            const eventEntry = entry as PerformanceEventTiming;
            const inputDelay = eventEntry.processingStart - eventEntry.startTime;
            inpValue = Math.max(inpValue, inputDelay);
          }
        }
        this.metrics.inp = inpValue;
        this.notifyListeners();
      });
      inpObserver.observe({ type: 'event', buffered: true });
      this.observers.set('inp', inpObserver);
    } catch (e) {
      console.warn('INP observer not supported');
    }
  }

  private measureTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.metrics));
  }

  onMetricsUpdate(listener: (metrics: PerformanceMetrics) => void) {
    this.listeners.add(listener);
    // Send current metrics immediately
    listener(this.metrics);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Send metrics to analytics
  async reportMetrics(endpoint?: string) {
    const metrics = this.getMetrics();
    const url = endpoint || '/api/performance';

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }

  // Performance score calculation
  calculateScore(): number {
    const weights = {
      fcp: 0.15,
      lcp: 0.25,
      fid: 0.15,
      cls: 0.25,
      ttfb: 0.1,
      inp: 0.1,
    };

    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
      inp: { good: 200, poor: 500 },
    };

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(this.metrics).forEach(([metric, value]) => {
      if (value !== null) {
        const threshold = thresholds[metric as keyof typeof thresholds];
        const weight = weights[metric as keyof typeof weights];
        
        let score: number;
        if (value <= threshold.good) {
          score = 100;
        } else if (value >= threshold.poor) {
          score = 0;
        } else {
          const range = threshold.poor - threshold.good;
          const position = value - threshold.good;
          score = 100 - (position / range) * 100;
        }

        totalScore += score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.listeners.clear();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    inp: null,
  });

  const [score, setScore] = useState(0);

  useEffect(() => {
    const unsubscribe = performanceMonitor.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
      setScore(performanceMonitor.calculateScore());
    });

    return unsubscribe;
  }, []);

  return { metrics, score };
}
`);

    this.log('Performance monitoring created');
  }
}