"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg]:h-4 [&>svg]:w-4 [&>svg+div]:translate-y-[-3px] [&:has([role=alert-description])]:pr-12",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  children: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(({ className, variant, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(alertVariants({ variant }), className)} role="alert" {...props}>
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&:not(:first-child)]:mt-1", className)} {...props} />
  ),
)
AlertDescription.displayName = "AlertDescription"

const AlertIcon = React.forwardRef<SVGSVGElement, React.HTMLAttributes<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <Slot>
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-4 w-4", className)}
        {...props}
      />
    </Slot>
  ),
)
AlertIcon.displayName = "AlertIcon"

export { Alert, AlertTitle, AlertDescription, AlertIcon }

export type { AlertProps }
export type { VariantProps as AlertVariantProps }

export type AlertVariant = "default" | "destructive"
