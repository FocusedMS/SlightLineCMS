import { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { RootState } from '../store'

interface RouteGuardProps {
  children: ReactNode
  requiredRole?: 'Blogger' | 'Admin'
  allowGuest?: boolean
  fallbackPath?: string
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  allowGuest = false, 
  fallbackPath = '/login' 
}: RouteGuardProps) {
  const { user, token } = useSelector((state: RootState) => state.auth)
  const location = useLocation()

  // Not authenticated
  if (!token || !user) {
    if (allowGuest) {
      return <>{children}</>
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  // Role-based access control
  if (requiredRole) {
    const hasRole = user.role === requiredRole || user.role === 'Admin'
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}

// Convenience components for common use cases
export function GuestRoute({ children }: { children: ReactNode }) {
  return <RouteGuard allowGuest>{children}</RouteGuard>
}

export function BloggerRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiredRole="Blogger">{children}</RouteGuard>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiredRole="Admin">{children}</RouteGuard>
}

export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>
}
