/**
 * Agent 4: UI/UX Agent
 * Enhances user interface and experience
 */

import { BaseAgent, Task } from './base-agent';

export class UIUXAgent extends BaseAgent {
  constructor() {
    super('UIUX');
    this.tasks = this.getTasks();
  }

  getTasks(): Task[] {
    return [
      {
        id: 'ui-1',
        name: 'Create responsive layouts',
        description: 'Mobile-first responsive design',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'ui-2',
        name: 'Implement loading states',
        description: 'Skeleton screens and progress indicators',
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'ui-3',
        name: 'Add animations',
        description: 'Smooth transitions and micro-interactions',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'ui-4',
        name: 'Create dashboard themes',
        description: 'Light/dark mode support',
        priority: 'medium',
        status: 'pending'
      },
      {
        id: 'ui-5',
        name: 'Optimize performance',
        description: 'Virtual scrolling and lazy loading',
        priority: 'low',
        status: 'pending'
      }
    ];
  }

  async execute(): Promise<void> {
    this.log('Starting UI/UX enhancements...');
    
    for (const task of this.tasks) {
      await this.executeTask(task);
    }
  }

  protected async performTask(task: Task): Promise<void> {
    switch (task.id) {
      case 'ui-1':
        await this.createResponsiveLayouts();
        break;
      case 'ui-2':
        await this.implementLoadingStates();
        break;
      case 'ui-3':
        await this.addAnimations();
        break;
      case 'ui-4':
        await this.createThemes();
        break;
      case 'ui-5':
        await this.optimizePerformance();
        break;
    }
  }

  private async createResponsiveLayouts() {
    // Create responsive grid system
    await this.writeFile('components/layouts/dashboard-layout.tsx', `
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function DashboardLayout({
  children,
  sidebar,
  header,
  className
}: DashboardLayoutProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

  React.useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header */}
      {header && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            {isMobile && sidebar && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 hover:bg-accent rounded-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            {header}
          </div>
        </header>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              'border-r bg-card transition-all duration-300',
              isMobile ? 'fixed inset-y-0 left-0 z-40' : 'relative',
              sidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
              isTablet && !isMobile && 'w-20'
            )}
          >
            {sidebar}
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {isMobile && sidebarOpen && sidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 }
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        \`grid-cols-\${cols.default}\`,
        cols.sm && \`sm:grid-cols-\${cols.sm}\`,
        cols.md && \`md:grid-cols-\${cols.md}\`,
        cols.lg && \`lg:grid-cols-\${cols.lg}\`,
        cols.xl && \`xl:grid-cols-\${cols.xl}\`,
        className
      )}
    >
      {children}
    </div>
  );
}
`);

    // Create responsive hooks
    await this.writeFile('hooks/use-media-query.ts', `
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Use addEventListener for modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

// Preset breakpoints
export const useBreakpoint = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 768px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1280px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    current: isMobile ? 'mobile' : isTablet ? 'tablet' : isDesktop ? 'desktop' : 'large'
  };
};
`);

    this.log('Responsive layouts created');
  }

  private async implementLoadingStates() {
    // Create skeleton components
    await this.writeFile('components/ui/skeleton-loader.tsx', `
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'text',
  animation = 'pulse',
  width,
  height
}: SkeletonProps) {
  const baseStyles = 'bg-muted';
  
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-md'
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? '40px' : undefined),
        height: height || (variant === 'circular' ? '40px' : undefined)
      }}
    />
  );
}

// Campaign card skeleton
export function CampaignCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-6 w-48" />
        <Skeleton variant="rounded" className="h-6 w-20" />
      </div>
      
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-4 w-40" />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-24" />
          <Skeleton variant="text" className="h-6 w-32" />
        </div>
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-24" />
          <Skeleton variant="text" className="h-6 w-32" />
        </div>
      </div>
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full">
      <div className="border rounded-lg">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-4 flex-1" />
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b last:border-0 p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  variant="text"
                  className="h-4 flex-1"
                  style={{ width: \`\${80 + Math.random() * 20}%\` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`);

    // Create loading wrapper component
    await this.writeFile('components/common/loading-wrapper.tsx', `
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingWrapperProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  skeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorState?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LoadingWrapper({
  isLoading,
  error,
  isEmpty,
  skeleton,
  emptyState,
  errorState,
  children,
  className
}: LoadingWrapperProps) {
  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {errorState || (
          <div className="text-center">
            <p className="text-destructive mb-2">Something went wrong</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        {skeleton || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        {emptyState || (
          <div className="text-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
`);

    this.log('Loading states implemented');
  }

  private async addAnimations() {
    // Create animation utilities
    await this.writeFile('lib/animations.ts', `
import { type ClassValue } from 'clsx';

export const animations = {
  fadeIn: 'animate-in fade-in duration-500',
  fadeOut: 'animate-out fade-out duration-300',
  slideInTop: 'animate-in slide-in-from-top duration-300',
  slideInBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInLeft: 'animate-in slide-in-from-left duration-300',
  slideInRight: 'animate-in slide-in-from-right duration-300',
  zoomIn: 'animate-in zoom-in-90 duration-300',
  zoomOut: 'animate-out zoom-out-90 duration-300',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
};

export const transitions = {
  all: 'transition-all duration-200',
  colors: 'transition-colors duration-200',
  opacity: 'transition-opacity duration-200',
  transform: 'transition-transform duration-200',
  shadow: 'transition-shadow duration-200',
};

// Stagger animation helper
export function staggeredAnimation(
  index: number,
  baseDelay: number = 50
): ClassValue {
  return {
    animationDelay: \`\${index * baseDelay}ms\`,
  };
}

// Custom keyframes for Tailwind config
export const customKeyframes = {
  shimmer: {
    '0%': { backgroundPosition: '-1000px 0' },
    '100%': { backgroundPosition: '1000px 0' },
  },
  slideDown: {
    from: { height: '0' },
    to: { height: 'var(--radix-accordion-content-height)' },
  },
  slideUp: {
    from: { height: 'var(--radix-accordion-content-height)' },
    to: { height: '0' },
  },
};
`);

    // Create animated components
    await this.writeFile('components/common/animated-number.tsx', `
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  format?: (value: number) => string;
}

export function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
  format
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = Date.now();
    const diff = value - startValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + diff * easeOutCubic;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = format
    ? format(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}
`);

    this.log('Animations added');
  }

  private async createThemes() {
    // Create theme system
    await this.writeFile('lib/themes.ts', `
export const themes = {
  light: {
    name: 'Light',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      'secondary-foreground': '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '240 10% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
    }
  },
  blue: {
    name: 'Blue',
    colors: {
      background: '222 47% 11%',
      foreground: '213 31% 91%',
      card: '223 47% 11%',
      'card-foreground': '213 31% 91%',
      popover: '224 47% 11%',
      'popover-foreground': '215 20.2% 65.1%',
      primary: '210 40% 98%',
      'primary-foreground': '222.2 47.4% 1.2%',
      secondary: '222.2 47.4% 11.2%',
      'secondary-foreground': '210 40% 98%',
      muted: '223 47% 11%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '216 34% 17%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 63% 31%',
      'destructive-foreground': '210 40% 98%',
      border: '216 34% 17%',
      input: '216 34% 17%',
      ring: '224 64% 33%',
    }
  }
};

export type Theme = keyof typeof themes;

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const colors = themes[theme].colors;

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(\`--\${key}\`, value);
  });

  root.setAttribute('data-theme', theme);
}
`);

    // Create theme provider
    await this.writeFile('components/providers/theme-provider.tsx', `
'use client';

import React from 'react';
import { themes, type Theme, applyTheme } from '@/lib/themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: typeof themes;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'meta-ads-theme'
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  React.useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    if (stored && stored in themes) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme(defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
    applyTheme(newTheme);
  }, [storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}
`);

    this.log('Theme system created');
  }

  private async optimizePerformance() {
    // Create virtual scrolling component
    await this.writeFile('components/common/virtual-list.tsx', `
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight]);

  const getVisibleRange = useCallback(() => {
    const start = Math.max(0, Math.floor(scrollTop / getItemHeight(0)) - overscan);
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / getItemHeight(0)) + overscan
    );
    return { start, end };
  }, [scrollTop, containerHeight, items.length, getItemHeight, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerHeight = () => {
      setContainerHeight(container.clientHeight);
    };

    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);

    return () => {
      window.removeEventListener('resize', updateContainerHeight);
    };
  }, []);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  const { start, end } = getVisibleRange();
  const visibleItems = items.slice(start, end);
  const totalHeight = getTotalHeight();
  const offsetY = getItemOffset(start);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: \`translateY(\${offsetY}px)\`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={start + index}
              style={{ height: getItemHeight(start + index) }}
            >
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

    // Create lazy loading utilities
    await this.writeFile('hooks/use-intersection-observer.ts', `
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0%',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const elementRef = useRef<Element>();
  const frozen = useRef(false);

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    if (frozen.current && freezeOnceVisible) return;
    setEntry(entry);
    if (entry.isIntersecting && freezeOnceVisible) {
      frozen.current = true;
    }
  };

  useEffect(() => {
    const node = elementRef.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen.current || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();
  }, [elementRef.current, threshold, root, rootMargin, freezeOnceVisible]);

  return { ref: elementRef, entry };
}

// Lazy component wrapper
export function LazyComponent({
  children,
  placeholder,
  rootMargin = '50px',
}: {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  rootMargin?: string;
}) {
  const { ref, entry } = useIntersectionObserver({
    rootMargin,
    freezeOnceVisible: true,
  });

  return (
    <div ref={ref}>
      {entry?.isIntersecting ? children : placeholder || <div />}
    </div>
  );
}
`);

    this.log('Performance optimizations implemented');
  }
}