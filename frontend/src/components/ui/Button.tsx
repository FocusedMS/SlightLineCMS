import React from 'react'

/**
 * A reusable button component with opinionated styling.  The button accepts a
 * `variant` prop to adjust its look: primary, secondary, outline or danger.
 * Motion effects provide subtle feedback on hover and active states.  Pass
 * through any native button attributes via rest props.
 */
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
}

export const Button: React.FC<ButtonProps & { asChild?: boolean }> = ({
  variant = 'primary',
  className = '',
  type = 'button',
  asChild = false,
  children,
  ...rest
}) => {
  const base =
    'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-transform transition-colors duration-150 ease-out focus:outline-none'
  let variantClass = ''
  switch (variant) {
    case 'primary':
      variantClass = 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
      break
    case 'secondary':
      variantClass = 'bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-95'
      break
    case 'outline':
      variantClass = 'border border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95'
      break
    case 'danger':
      variantClass = 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
      break
    default:
      variantClass = ''
  }

  const classes = `${base} ${variantClass} ${className}`.trim()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${classes} ${children.props.className ?? ''}`.trim(),
      ...rest,
    })
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}

export default Button