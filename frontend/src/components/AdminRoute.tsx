import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { RootState } from '../store'

export default function AdminRoute({ children }: { children: JSX.Element }) {
  const user = useSelector((s: RootState)=>s.auth.user)
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'Admin' ? children : <Navigate to="/" replace />
}
