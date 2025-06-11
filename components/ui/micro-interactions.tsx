"use client"

import * as React from "react"
// import { motion, useSpring, useTransform, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

// Haptic Feedback Utilities
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

// Interactive Button with Micro-interactions
interface InteractiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  hapticFeedback?: boolean
  ripple?: boolean
}

export const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    hapticFeedback = true,
    ripple = true,
    children,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback) {
        haptics.light()
      }

      if (ripple) {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const newRipple = { id: Date.now(), x, y }
        
        setRipples(prev => [...prev, newRipple])
        
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id))
        }, 600)
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
      <motion.button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md text-sm font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
          "touch-target",
          variants[variant],
          sizes[size],
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        {...props}
      >
        {children}
        
        {/* Ripple Effect */}
        {ripples.map(ripple => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </motion.button>
    )
  }
)
InteractiveButton.displayName = "InteractiveButton"

// Floating Action Button
interface FloatingActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  icon: React.ReactNode
  label?: string
}

export function FloatingActionButton({
  position = "bottom-right",
  icon,
  label,
  className,
  onClick,
  ...props
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    haptics.medium()
    onClick?.(e)
  }

  return (
    <motion.button
      className={cn(
        "fixed z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground",
        "shadow-lg hover:shadow-xl transition-shadow",
        "flex items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        positionClasses[position],
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleClick}
      aria-label={label}
      {...props}
    >
      {icon}
    </motion.button>
  )
}

// Magnetic Button Effect
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number
}

export const MagneticButton = React.forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ strength = 0.3, children, className, ...props }, ref) => {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!buttonRef.current) return
      
      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength
      
      x.set(deltaX)
      y.set(deltaY)
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    return (
      <motion.button
        ref={buttonRef}
        style={{ x, y }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative inline-flex items-center justify-center rounded-md text-sm font-medium",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "h-10 px-4 py-2 transition-colors touch-target",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
MagneticButton.displayName = "MagneticButton"

// Pulse Effect for Notifications
interface PulseIndicatorProps {
  size?: "sm" | "md" | "lg"
  color?: "red" | "green" | "blue" | "yellow"
  className?: string
}

export function PulseIndicator({ 
  size = "md", 
  color = "red", 
  className 
}: PulseIndicatorProps) {
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
    <motion.div
      className={cn(
        "rounded-full",
        sizes[size],
        colors[color],
        className
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// Tilt Card Effect
interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tiltStrength?: number
}

export const TiltCard = React.forwardRef<HTMLDivElement, TiltCardProps>(
  ({ tiltStrength = 0.1, children, className, ...props }, ref) => {
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotateX = useTransform(y, [-100, 100], [30, -30])
    const rotateY = useTransform(x, [-100, 100], [-30, 30])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      x.set((e.clientX - centerX) * tiltStrength)
      y.set((e.clientY - centerY) * tiltStrength)
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    return (
      <motion.div
        ref={ref}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "rounded-lg border bg-card p-6 shadow-sm",
          "hover:shadow-lg transition-shadow duration-300",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
TiltCard.displayName = "TiltCard"

// Stagger Animation for Lists
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1 
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: React.ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Smooth Page Transitions
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  )
}

// Scroll-triggered Animations
export function useScrollAnimation() {
  return {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
    viewport: { once: true, margin: "-100px" }
  }
}