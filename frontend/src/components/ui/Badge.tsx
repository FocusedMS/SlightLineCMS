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
      classes = 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 ring-1 ring-emerald-400/30 dark:ring-emerald-400/30'
      break
    case 'pending':
      classes = 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 ring-1 ring-amber-400/30 dark:ring-amber-400/30'
      break
    case 'rejected':
      classes = 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 ring-1 ring-rose-400/30 dark:ring-rose-400/30'
      break
    case 'draft':
    default:
      classes = 'bg-slate-500/10 text-slate-600 dark:bg-white/5 dark:text-slate-300 ring-1 ring-slate-400/30 dark:ring-white/10'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${classes} ${className}`}>{children}</span>
  )
}

export default Badge