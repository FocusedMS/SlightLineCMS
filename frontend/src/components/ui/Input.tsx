import React from 'react'

/**
 * Simple text input component with consistent styling.  Adds focus ring and
 * rounded corners.  Passes through all native input attributes.  Use
 * type="password" or other HTML input types as needed.
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', ...rest }, ref) => (
    <input
      ref={ref}
      className={`input ${className}`}
      {...rest}
    />
  )
)
Input.displayName = 'Input'

export default Input