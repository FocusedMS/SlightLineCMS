import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'

type IconBtnProps = {
  icon: React.ComponentType<{ className?: string }>
  tooltip?: string
  to?: string
  onClick?: () => void
  className?: string
  ariaLabel?: string
}

export const IconBtn: React.FC<IconBtnProps> = ({ icon: Icon, tooltip, to, onClick, className = '', ariaLabel }) => {
  const content = (
    <Button variant="ghost" iconOnly className={className} aria-label={ariaLabel || tooltip} title={tooltip} onClick={onClick}>
      <Icon className="h-4 w-4" />
    </Button>
  )
  if (to) return <Link to={to}>{content}</Link>
  return content
}

export default IconBtn

