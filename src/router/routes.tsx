import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthGuard from './guards/AuthGuard'
import RoleGuard from './guards/RoleGuard'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'

// Lazy-loaded pages
import { lazy, Suspense } from 'react'
import { PageLoader } from '@/components/common/PageLoader'

const wrap = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const OtpPage = lazy(() => import('@/pages/auth/OtpPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const MembersPage = lazy(() => import('@/pages/members/MembersPage'))
const MemberDetailPage = lazy(() => import('@/pages/members/MemberDetailPage'))
const MembershipsPage = lazy(() => import('@/pages/memberships/MembershipsPage'))
const TrainersPage = lazy(() => import('@/pages/trainers/TrainersPage'))
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const WorkoutsPage = lazy(() => import('@/pages/workouts/WorkoutsPage'))
const DietPlansPage = lazy(() => import('@/pages/workouts/DietPlansPage'))
const AnalyticsPage = lazy(() => import('@/pages/analytics/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'))
const AdminPage = lazy(() => import('@/pages/admin/AdminPage'))

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: wrap(LoginPage) },
      { path: 'otp', element: wrap(OtpPage) },
    ],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: wrap(DashboardPage) },

      { path: 'members', element: wrap(MembersPage) },
      { path: 'members/:id', element: wrap(MemberDetailPage) },

      { path: 'memberships', element: wrap(MembershipsPage) },

      { path: 'trainers', element: wrap(TrainersPage) },

      { path: 'payments', element: wrap(PaymentsPage) },

      { path: 'attendance', element: wrap(AttendancePage) },

      { path: 'workouts', element: wrap(WorkoutsPage) },
      { path: 'diet', element: wrap(DietPlansPage) },

      { path: 'analytics', element: wrap(AnalyticsPage) },

      { path: 'notifications', element: wrap(NotificationsPage) },

      {
        path: 'settings',
        element: (
          <RoleGuard allowed={['gym_owner']}>
            {wrap(SettingsPage)}
          </RoleGuard>
        ),
      },

      {
        path: 'admin',
        element: (
          <RoleGuard allowed={['super_admin']}>
            {wrap(AdminPage)}
          </RoleGuard>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
