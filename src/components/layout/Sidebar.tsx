import { NavLink } from 'react-router-dom'
import { useGymStore } from '@/store/gym.store'
import { useAuthStore, selectRole } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, CreditCard, Dumbbell, Salad,
  CalendarCheck, BarChart3, Bell, Settings, Shield,
  UserCog, Layers, Zap,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, roles: ['*'] },
  { to: '/members',       label: 'Members',        icon: Users,           roles: ['*'] },
  { to: '/memberships',   label: 'Memberships',    icon: Layers,          roles: ['gym_owner', 'staff'] },
  { to: '/trainers',      label: 'Trainers',       icon: UserCog,         roles: ['gym_owner', 'staff'] },
  { to: '/payments',      label: 'Payments',       icon: CreditCard,      roles: ['gym_owner', 'staff'] },
  { to: '/attendance',    label: 'Attendance',     icon: CalendarCheck,   roles: ['*'] },
  { to: '/workouts',      label: 'Workouts',       icon: Dumbbell,        roles: ['*'] },
  { to: '/diet',          label: 'Diet Plans',     icon: Salad,           roles: ['*'] },
  { to: '/analytics',     label: 'Analytics',      icon: BarChart3,       roles: ['gym_owner', 'staff'] },
  { to: '/notifications', label: 'Notifications',  icon: Bell,            roles: ['*'] },
  { to: '/settings',      label: 'Settings',       icon: Settings,        roles: ['gym_owner'] },
  { to: '/admin',         label: 'Platform Admin', icon: Shield,          roles: ['super_admin'] },
]

export default function Sidebar() {
  const branding = useGymStore((s) => s.branding)
  const gymId = useGymStore((s) => s.gymId)
  const role = useAuthStore(selectRole)

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('*') || item.roles.includes(role ?? '')
  )

  return (
    <aside className="glass-sidebar flex h-full w-64 flex-shrink-0 flex-col">
      {/* Logo + Gym Name */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.name}
            className="h-9 w-9 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}
          >
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate max-w-[148px]">
            {branding?.name ?? 'GymOS'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs capitalize" style={{ color: '#64748B' }}>
              {role?.replace('_', ' ') ?? 'admin'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-5 px-3">
        <p
          className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: '#475569' }}
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
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                        background: 'rgba(59,130,246,0.12)',
                        boxShadow: 'inset 2px 0 0 #3B82F6',
                      }
                    : {}
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0 transition-colors duration-200',
                        isActive
                          ? 'text-blue-400'
                          : 'text-slate-500 group-hover:text-slate-300'
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
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.15)' }}
          >
            <Zap className="h-3 w-3 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#475569' }}>
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
