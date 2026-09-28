import { Navigate } from 'react-router-dom'
import { useAuthStore, selectRole } from '@/store/auth.store'

const ROLE_HOME: Record<string, string> = {
  superadmin: '/superadmin/dashboard',
  admin: '/admin/dashboard',
  sub_admin: '/sub-admin/dashboard',
  trainer: '/trainer/dashboard',
  member: '/member/pay',
}

/** Sends an authenticated user to their role's dashboard home. */
export default function RoleRedirect() {
  const role = useAuthStore(selectRole) ?? ''
  return <Navigate to={ROLE_HOME[role] ?? '/auth/login'} replace />
}
