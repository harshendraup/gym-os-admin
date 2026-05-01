import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="min-h-screen bg-muted/30">
      <Outlet />
    </div>
  )
}
