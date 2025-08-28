import React from 'react'

export type BadgeProps = {
  children: React.ReactNode
  variant?: 'published' | 'pending' | 'draft' | 'rejected'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'draft', className = '' }) => {
  let classes = ''
  switch (variant) {
    case 'published':
      classes = 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30'
      break
    case 'pending':
      classes = 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30'
      break
    case 'rejected':
      classes = 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30'
      break
    case 'draft':
    default:
      classes = 'bg-white/5 text-text-soft ring-1 ring-white/10'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${classes} ${className}`}>{children}</span>
  )
}

export default Badge