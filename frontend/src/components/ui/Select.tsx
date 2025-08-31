import React from 'react'

export type SelectProps = {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  children, 
  className = '',
  disabled = false
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full rounded-[14px] px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none bg-white/90 dark:bg-slate-800/90 border border-slate-300/50 dark:border-slate-600/50 text-slate-800 dark:text-white focus:border-purple-500/50 focus:ring-purple-500/20 ${className}`}
    >
      {children}
    </select>
  )
}

export default Select