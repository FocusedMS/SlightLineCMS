import React from 'react'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  iconOnly?: boolean
}

export const Button: React.FC<ButtonProps & { asChild?: boolean }> = ({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
  type = 'button',
  asChild = false,
  children,
  ...rest
}) => {
  const base = 'inline-flex items-center justify-center gap-2 rounded-[18px] font-medium transition focus:outline-none focus:shadow-focus disabled:opacity-60 disabled:pointer-events-none'
  const sizeCls = iconOnly
    ? 'h-9 w-9'
    : size === 'sm'
      ? 'h-9 px-3'
      : size === 'lg'
        ? 'h-12 px-6'
        : 'h-10 px-5'

  let variantCls = ''
  switch (variant) {
    case 'primary':
      variantCls = 'bg-brand-600 hover:bg-brand-500 text-white shadow-card'
      break
    case 'secondary':
      variantCls = 'bg-bg-raised hover:bg-bg-subtle border border-white/10 text-white'
      break
    case 'ghost':
      variantCls = 'hover:bg-white/5 text-white'
      break
    case 'danger':
      variantCls = 'bg-rose-600 hover:bg-rose-500 text-white'
      break
    default:
      variantCls = ''
  }

  const classes = `${base} ${sizeCls} ${variantCls} ${className}`.trim()

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