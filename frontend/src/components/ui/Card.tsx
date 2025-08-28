import React from 'react'

/**
 * A card component providing padding, border and rounded corners.  Useful for
 * grouping related content sections.  Accepts custom className for
 * additional styling.  Cards are responsive and cast a small shadow on
 * hover for depth.
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className = '', children, ...rest }) => {
  return (
    <div
      className={`rounded-[18px] border p-6 shadow-card bg-bg-raised border-white/10 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export default Card