import { NavLink } from 'react-router-dom'
import { useGymStore } from '@/store/gym.store'
import { useAuthStore, selectRole } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, CreditCard, Dumbbell, Salad,
  CalendarCheck, BarChart3, Bell, Settings,
  UserCog, Layers, Zap, Building2,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
  { to: '/members', label: 'Members', icon: Users, roles: ['gym_owner', 'staff'] },
  { to: '/memberships', label: 'Subscription', icon: Layers, roles: ['*'] },
  { to: '/users', label: 'Users', icon: Users, roles: ['admin'] },
  { to: '/trainers', label: 'Trainner', icon: UserCog, roles: ['admin'] },
  { to: '/payments', label: 'Payments', icon: CreditCard, roles: ['gym_owner', 'staff'] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: ['*'] },
  { to: '/workout-models', label: 'Workout Models', icon: Dumbbell, roles: ['admin'] },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell, roles: ['*'] },
  { to: '/diet', label: 'Diet Plans', icon: Salad, roles: ['*'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['gym_owner', 'staff'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['*'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['gym_owner'] },
  { to: '/businesses', label: 'Businesses', icon: Building2, roles: ['super_admin'] },
]

export default function Sidebar() {
  const branding = useGymStore((s) => s.branding)
  const gymId = useGymStore((s) => s.gymId)
  const contextRole = useAuthStore(selectRole)
  const userRole = useAuthStore((s) => (s.user as any)?.role ?? '')
  const role = (contextRole || userRole || '').toLowerCase()

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('*') || item.roles.includes(role ?? '')
  )

  return (
    <aside className="glass-sidebar flex h-full w-64 flex-shrink-0 flex-col" style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(59,130,246,0.2)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.08)',
    }}>
      {/* Logo + Gym Name */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}
      >
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.name}
            className="h-9 w-9 rounded-xl object-cover flex-shrink-0 shadow-md"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
          >
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate max-w-[148px]">
            {branding?.name ?? 'GymOS'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm" />
            <p className="text-xs capitalize" style={{ color: '#64748B' }}>
              {(role || 'admin').replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <p
          className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: '#64748b' }}
        >
          Menu
        </p>
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-all duration-200',
                    isActive
                      ? 'text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)',
                      boxShadow: 'inset 2px 0 0 #2563EB, inset 0 1px 3px rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }
                    : {
                      background: 'transparent',
                    }
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0 transition-colors duration-200',
                        isActive
                          ? 'text-blue-600'
                          : 'text-slate-500 group-hover:text-slate-700'
                      )}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4"
        style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)' }}
          >
            <Zap className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#94a3b8' }}>
              Gym ID
            </p>
            <p className="text-xs font-mono font-semibold" style={{ color: '#64748B' }}>
              {gymId?.slice(0, 8).toUpperCase() ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
