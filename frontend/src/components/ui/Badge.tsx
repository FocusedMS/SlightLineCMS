import React from 'react'

/**
 * A small badge/pill to display status or categorical information.  Colour
 * variants are computed automatically based on the provided type.  Pass
 * additional class names to adjust spacing or font size.
 */
export type BadgeProps = {
  children: React.ReactNode
  status?: 'success' | 'warning' | 'neutral' | 'danger'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, status = 'neutral', className = '' }) => {
  let classes = ''
  switch (status) {
    case 'success':
      classes = 'bg-green-100 text-green-700'
      break
    case 'warning':
      classes = 'bg-amber-100 text-amber-700'
      break
    case 'danger':
      classes = 'bg-red-100 text-red-700'
      break
    default:
      classes = 'bg-gray-100 text-gray-700'
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${classes} ${className}`}>{children}</span>
  )
}

export default Badge