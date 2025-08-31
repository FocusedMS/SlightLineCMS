import React from 'react'

export type CardProps = {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-[18px] border p-6 shadow-card bg-white/90 dark:bg-slate-900/90 border-slate-200/50 dark:border-white/10 backdrop-blur ${className}`}>
      {children}
    </div>
  )
}

export default Card