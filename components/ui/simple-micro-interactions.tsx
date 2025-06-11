"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Haptic Feedback Utilities (same as before)
export const haptics = {
  light: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10)
    }
  },
  medium: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20)
    }
  },
  heavy: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([30, 10, 30])
    }
  },
  success: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([10, 5, 10])
    }
  },
  error: () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([50, 25, 50, 25, 50])
    }
  }
}

// Simple Interactive Button without framer-motion
interface SimpleInteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  hapticFeedback?: boolean
}

export const SimpleInteractiveButton = React.forwardRef<HTMLButtonElement, SimpleInteractiveButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    hapticFeedback = true,
    children,
    onClick,
    ...props 
  }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback) {
        haptics.light()
      }
      onClick?.(e)
    }

    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "transition-all duration-200 hover:scale-105 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "touch-target",
          variants[variant],
          sizes[size],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SimpleInteractiveButton.displayName = "SimpleInteractiveButton"

// Pulse Indicator without framer-motion
interface SimplePulseIndicatorProps {
  size?: "sm" | "md" | "lg"
  color?: "red" | "green" | "blue" | "yellow"
  className?: string
}

export function SimplePulseIndicator({ 
  size = "md", 
  color = "red", 
  className 
}: SimplePulseIndicatorProps) {
  const sizes = {
    sm: "h-2 w-2",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }

  const colors = {
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
  }

  return (
    <div
      className={cn(
        "rounded-full animate-pulse",
        sizes[size],
        colors[color],
        className
      )}
    />
  )
}

// Simple Card with hover effects
interface SimpleHoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export const SimpleHoverCard = React.forwardRef<HTMLDivElement, SimpleHoverCardProps>(
  ({ hover = true, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          "transition-all duration-300",
          hover && "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SimpleHoverCard.displayName = "SimpleHoverCard"

// Simple Page Transition
export function SimplePageTransition({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in">
      {children}
    </div>
  )
}

// Simple Stagger Container
interface SimpleStaggerContainerProps {
  children: React.ReactNode
  className?: string
}

export function SimpleStaggerContainer({ children, className }: SimpleStaggerContainerProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {React.Children.map(children, (child, index) => (
        <div 
          className="fade-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}