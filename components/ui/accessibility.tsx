"use client"

import * as React from "react"
// // import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { AlertTriangle, X } from "lucide-react"

// Skip Link Component for keyboard navigation
interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium transition-all duration-200"
    >
      {children}
    </a>
  )
}

// Live Region for dynamic content announcements
interface LiveRegionProps {
  children: React.ReactNode
  level?: "polite" | "assertive"
  atomic?: boolean
}

export function LiveRegion({ 
  children, 
  level = "polite", 
  atomic = false 
}: LiveRegionProps) {
  return (
    <div
      aria-live={level}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  className?: string
}

export function FocusTrap({ 
  children, 
  enabled = true, 
  className 
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener("keydown", handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener("keydown", handleTabKey)
    }
  }, [enabled])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Enhanced Button with accessibility features
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  loading?: boolean
  loadingText?: string
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    loading = false,
    loadingText = "Loading...",
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "touch-target",
          
          // Variant styles
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          
          // Size styles
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-describedby={loading ? "button-loading" : undefined}
        {...props}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            />
            <span id="button-loading" className="sr-only">
              {loadingText}
            </span>
            {loadingText}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
AccessibleButton.displayName = "AccessibleButton"

// High Contrast Mode Detector
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)")
    setIsHighContrast(mediaQuery.matches)

    const handleChange = () => setIsHighContrast(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return isHighContrast
}

// Reduced Motion Detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)

    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

// Error Boundary with accessibility features
interface AccessibleErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class AccessibleErrorBoundary extends React.Component<
  AccessibleErrorBoundaryProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: AccessibleErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
        />
      )
    }

    return this.props.children
  }
}

// Default Error Fallback Component
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error
  resetError: () => void 
}) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
    >
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <AccessibleButton onClick={resetError}>
        Try Again
      </AccessibleButton>
    </div>
  )
}

// Toast notification with accessibility
interface AccessibleToastProps {
  title: string
  description?: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
  onClose?: () => void
}

export function AccessibleToast({
  title,
  description,
  type = "info",
  duration = 5000,
  onClose
}: AccessibleToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onClose?.(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          role="alert"
          aria-live="polite"
          className={cn(
            "fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg",
            typeStyles[type]
          )}
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold">{title}</h3>
              {description && (
                <p className="mt-1 text-sm opacity-90">{description}</p>
              )}
            </div>
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose?.(), 300)
              }}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Keyboard Navigation Helper
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  options: {
    loop?: boolean
    orientation?: "horizontal" | "vertical" | "both"
  } = {}
) {
  const { loop = true, orientation = "both" } = options

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[]

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
      let nextIndex = currentIndex

      const isHorizontal = orientation === "horizontal" || orientation === "both"
      const isVertical = orientation === "vertical" || orientation === "both"

      switch (e.key) {
        case "ArrowLeft":
          if (isHorizontal) {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case "ArrowRight":
          if (isHorizontal) {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case "ArrowUp":
          if (isVertical) {
            e.preventDefault()
            nextIndex = currentIndex - 1
          }
          break
        case "ArrowDown":
          if (isVertical) {
            e.preventDefault()
            nextIndex = currentIndex + 1
          }
          break
        case "Home":
          e.preventDefault()
          nextIndex = 0
          break
        case "End":
          e.preventDefault()
          nextIndex = focusableElements.length - 1
          break
        default:
          return
      }

      if (nextIndex < 0) {
        nextIndex = loop ? focusableElements.length - 1 : 0
      } else if (nextIndex >= focusableElements.length) {
        nextIndex = loop ? 0 : focusableElements.length - 1
      }

      focusableElements[nextIndex]?.focus()
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [loop, orientation])
}