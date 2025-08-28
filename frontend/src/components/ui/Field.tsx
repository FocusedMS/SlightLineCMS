import React from 'react'

export const Field: React.FC<{ label?: string; hint?: string; children: React.ReactNode; className?: string }>
  = ({ label, hint, children, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="text-sm text-amber-300/80">{hint}</p>}
    </div>
  )
}

export default Field

