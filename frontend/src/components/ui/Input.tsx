import React from 'react'

export type InputProps = {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  type?: string
  disabled?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  value, 
  onChange, 
  placeholder, 
  className = '',
  type = 'text',
  disabled = false,
  ...props
}, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-[14px] px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none bg-white/90 dark:bg-slate-800/90 border border-slate-300/50 dark:border-slate-600/50 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:border-purple-500/50 focus:ring-purple-500/20 ${className}`}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input