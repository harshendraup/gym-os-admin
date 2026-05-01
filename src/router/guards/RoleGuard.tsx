import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

interface RoleGuardProps {
  allowed: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ allowed, children, fallback }: RoleGuardProps) {
  const role = useAuthStore((s) => s.gymContext?.role)

  if (!role || !allowed.includes(role)) {
    return fallback ? <>{fallback}</> : <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
