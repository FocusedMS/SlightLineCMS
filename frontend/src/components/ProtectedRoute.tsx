import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import type { RootState } from '../store'

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useSelector((s: RootState)=>s.auth.user)
  return user ? children : <Navigate to="/login" replace />
}
