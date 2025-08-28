import React from 'react'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-lg px-3 py-2 focus:outline-none bg-[color:var(--surface)] border border-[color:var(--border)] text-[color:var(--text)] ${className}`}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid color-mix(in oklab, var(--primary) 60%, transparent)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
      {...rest}
    />
  )
)
Textarea.displayName = 'Textarea'

export default Textarea


