import { NavLink } from 'react-router-dom'
import { useGymStore } from '@/store/gym.store'
import { useAuthStore, selectRole } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Dumbbell, UserCog, Zap, Building2, Salad, Activity, CreditCard,
  Smartphone, Wallet, Handshake, Megaphone,
} from 'lucide-react'

const navItems = [
  // Super Admin
  { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['superadmin'] },
  { to: '/superadmin/businesses', label: 'Businesses', icon: Building2, roles: ['superadmin'] },
  { to: '/superadmin/admins', label: 'Admins', icon: UserCog, roles: ['superadmin'] },
  { to: '/superadmin/sub-admins', label: 'Sub-Admins', icon: UserCog, roles: ['superadmin'] },
  { to: '/superadmin/trainers', label: 'Trainers', icon: Dumbbell, roles: ['superadmin'] },
  { to: '/superadmin/members', label: 'Members', icon: Users, roles: ['superadmin'] },
  { to: '/superadmin/memberships', label: 'Memberships', icon: CreditCard, roles: ['superadmin'] },
  { to: '/superadmin/app-config', label: 'App Configuration', icon: Smartphone, roles: ['superadmin'] },
  { to: '/superadmin/payments', label: 'Payments', icon: Wallet, roles: ['superadmin'] },
  // Admin
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/admin/branches', label: 'Branches', icon: Building2, roles: ['admin'] },
  { to: '/admin/sub-admins', label: 'Sub-Admins', icon: UserCog, roles: ['admin'] },
  { to: '/admin/trainers', label: 'Trainers', icon: Dumbbell, roles: ['admin'] },
  { to: '/admin/diets', label: 'Diet Plans', icon: Salad, roles: ['admin'] },
  { to: '/admin/training-programs', label: 'Training Programs', icon: Activity, roles: ['admin'] },
  { to: '/admin/memberships', label: 'Memberships', icon: CreditCard, roles: ['admin'] },
  { to: '/admin/members', label: 'Members', icon: Users, roles: ['admin'] },
  { to: '/admin/payments', label: 'Payments', icon: Wallet, roles: ['admin'] },
  { to: '/admin/sales', label: 'Sales', icon: Handshake, roles: ['admin'] },
  { to: '/admin/settings/integrations/meta', label: 'Meta Lead Ads', icon: Megaphone, roles: ['admin'] },

  // Sub-Admin
  { to: '/sub-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['sub_admin'] },
  { to: '/sub-admin/trainers', label: 'Trainers', icon: Dumbbell, roles: ['sub_admin'] },
  { to: '/sub-admin/diets', label: 'Diet Plans', icon: Salad, roles: ['sub_admin'] },
  { to: '/sub-admin/training-programs', label: 'Training Programs', icon: Activity, roles: ['sub_admin'] },
  { to: '/sub-admin/payments', label: 'Payments', icon: Wallet, roles: ['sub_admin'] },
  { to: '/sub-admin/memberships', label: 'Memberships', icon: CreditCard, roles: ['sub_admin'] },
  { to: '/sub-admin/members', label: 'Members', icon: Users, roles: ['sub_admin'] },
]

export default function Sidebar() {
  const branding = useGymStore((s) => s.branding)
  const gymId = useGymStore((s) => s.gymId)
  const contextRole = useAuthStore(selectRole)
  const userRole = useAuthStore((s) => (s.user as any)?.role ?? '')
  const userName = useAuthStore((s) => s.user?.fullName ?? s.user?.firstName ?? '')
  const role = (contextRole || userRole || '').toLowerCase()

  const visibleItems = navItems.filter(
    (item) => item.roles.includes('*') || item.roles.includes(role ?? '')
  )

  return (
    <aside className="glass-sidebar relative flex h-full w-64 flex-shrink-0 flex-col overflow-hidden" style={{
      background: 'rgba(248,250,252,0.42)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      border: '1px solid rgba(59,130,246,0.2)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 32px rgba(0,0,0,0.08)',
    }}>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45"
        src="/images/jumping.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-white/25" aria-hidden="true" />
      <div className="relative z-10 flex h-full flex-col">
      {/* Logo + Gym Name */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(59,130,246,0.15)' }}
      >
        {branding?.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt={branding.name}
            className="h-9 w-auto rounded-xl object-cover flex-shrink-0 shadow-md"
          />
        ) : (
          <img
            src="/logo/k1_logo.png"
            alt="KrikalOne"
            className="h-9 w-auto flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate max-w-[148px]">
            {branding?.name ?? 'KrikalOne'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(var(--primary))' }} />
            <p className="text-xs font-medium capitalize" style={{ color: 'hsl(var(--primary))' }}>
              {(role || 'admin').replace('_', ' ')}
            </p>
          </div>
          {userName && (
            <p className="text-xs text-slate-500 truncate max-w-[148px] mt-0.5">{userName}</p>
          )}
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
                      background:
                        'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 100%)',
                      boxShadow: 'inset 2px 0 0 hsl(var(--primary)), inset 0 1px 3px hsl(var(--primary) / 0.1)',
                      border: '1px solid hsl(var(--primary) / 0.2)',
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
                        !isActive && 'text-slate-500 group-hover:text-slate-700'
                      )}
                      style={isActive ? { color: 'hsl(var(--primary))' } : undefined}
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
            style={{ background: 'hsl(var(--primary) / 0.15)' }}
          >
            <Zap className="h-3 w-3" style={{ color: 'hsl(var(--primary))' }} />
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
      </div>
    </aside>
  )
}
