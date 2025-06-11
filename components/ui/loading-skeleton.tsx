import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card"
  animation?: "pulse" | "wave" | "shimmer"
  width?: string | number
  height?: string | number
  count?: number
}

export function Skeleton({
  className,
  variant = "text",
  animation = "shimmer",
  width,
  height,
  count = 1,
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-muted relative overflow-hidden"
  
  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-pulse",
    shimmer: "skeleton"
  }

  const variantClasses = {
    text: "h-4 w-full rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "rounded-xl"
  }

  const style = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  }

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              animationClasses[animation],
              variantClasses[variant],
              className
            )}
            style={style}
            {...props}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  )
}

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean
  lines?: number
}

export function SkeletonCard({ 
  className, 
  showAvatar = true, 
  lines = 3,
  ...props 
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm",
        className
      )}
      {...props}
    >
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="space-y-2 flex-1">
            <Skeleton height={20} width="50%" />
            <Skeleton height={16} width="30%" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        <Skeleton count={lines} />
      </div>
    </div>
  )
}

interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function SkeletonTable({ 
  className, 
  rows = 5, 
  columns = 4,
  showHeader = true,
  ...props 
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        className
      )}
      {...props}
    >
      {showHeader && (
        <div className="border-b bg-muted/50 p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} height={20} width={`${100 / columns}%`} />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  height={16}
                  width={`${100 / columns}%`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SkeletonChartProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "bar" | "line" | "pie"
}

export function SkeletonChart({ 
  className, 
  type = "bar",
  ...props 
}: SkeletonChartProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 h-[350px] relative",
        className
      )}
      {...props}
    >
      <div className="space-y-2 mb-4">
        <Skeleton height={24} width="40%" />
        <Skeleton height={16} width="60%" />
      </div>
      
      {type === "bar" && (
        <div className="flex items-end justify-around h-[250px] gap-4">
          {[80, 65, 45, 90, 70, 55, 85].map((height, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height={`${height}%`}
              className="flex-1"
            />
          ))}
        </div>
      )}
      
      {type === "line" && (
        <div className="h-[250px] relative">
          <Skeleton
            variant="rectangular"
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0 100%, 14% 80%, 28% 60%, 42% 70%, 57% 40%, 71% 55%, 85% 30%, 100% 45%, 100% 100%)"
            }}
          />
        </div>
      )}
      
      {type === "pie" && (
        <div className="flex items-center justify-center h-[250px]">
          <Skeleton variant="circular" width={200} height={200} />
        </div>
      )}
    </div>
  )
}