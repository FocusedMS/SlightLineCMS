import React from 'react'

/**
 * A stylised select dropdown component.  Applies consistent rounding,
 * border styles and focus ring.  Accepts all native select attributes.
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select: React.FC<SelectProps> = ({ className = '', children, ...rest }) => {
  return (
    <select
      className={`select ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}

export default Select