import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-bg-subtle rounded'
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  )
}

// Convenience components for common use cases
export function SkeletonText({ 
  lines = 1, 
  className 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 ? '75%' : '100%'} 
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <Skeleton height={48} className="rounded-[14px]" />
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonAvatar({ size = 40, className }: { size?: number, className?: string }) {
  return <Skeleton variant="circular" width={size} height={size} className={className} />
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton height={40} className={cn('rounded-lg', className)} />
}
