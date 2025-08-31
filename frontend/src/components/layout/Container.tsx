import React from 'react'
import { cn } from '../../utils/cn'

interface ContainerProps {
  size?: 'full' | 'wide' | 'content'
  className?: string
  children: React.ReactNode
}

export const Container: React.FC<ContainerProps> = ({ 
  size = 'wide', 
  className, 
  children 
}) => {
  const sizeClasses = {
    full: '', // No width constraints, full-bleed
    wide: 'px-6 md:px-8', // Fluid width with gutters
    content: 'px-6 md:px-8 max-w-4xl mx-auto' // ~900-960px for reading
  }

  return (
    <div className={cn(sizeClasses[size], className)}>
      {children}
    </div>
  )
}
