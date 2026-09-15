import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed, Users, LogOut, Trophy, ChevronRight, Activity,
} from 'lucide-react'
import { useGymStore } from '@/store/gym.store'
import { useAuthStore } from '@/store/auth.store'
import { useBusinessBranding } from '@/hooks/useBusinessBranding'
import { T, display, mono, body } from '@/components/scoreboard/tokens'

const NAV = [
  { to: '/sub-admin/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sub-admin/trainers', key: 'trainers', label: 'Trainers', icon: Dumbbell },
  { to: '/sub-admin/diets', key: 'diets', label: 'Diet Plans', icon: UtensilsCrossed },
  { to: '/sub-admin/training-programs', key: 'training-programs', label: 'Training Programs', icon: Activity },
  { to: '/sub-admin/members', key: 'members', label: 'Members', icon: Users },
]

/**
 * Dark "locker-room scoreboard" chrome for the sub-admin section only.
 * Superadmin/admin keep using AppLayout — this is a sibling, not a
 * replacement, so their look is unaffected.
 */
export default function SubAdminLayout() {
  useBusinessBranding()
  const branding = useGymStore((s) => s.branding)
  const gymContext = useAuthStore((s) => s.gymContext)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const activeLabel = NAV.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Dashboard'
  const gymId = gymContext?.branchId ?? gymContext?.businessId ?? null
  const userName = user?.fullName ?? user?.firstName ?? ''

  return (
    <div style={{ ...body, background: T.chalk, minHeight: '100vh', display: 'flex', color: T.text }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: '252px',
          background: T.ink,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 8px 24px',
            borderBottom: `1px solid ${T.inkLine}`,
            marginBottom: '22px',
          }}
        >
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.name}
              style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${T.signal}, ${T.brass})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Dumbbell size={20} color={T.ink} strokeWidth={2.5} />
            </div>
          )}
          <div className="min-w-0">
            <div
              style={{ ...display, color: '#FCFAF4', fontSize: 16, textTransform: 'uppercase', lineHeight: 1 }}
              className="truncate"
            >
              {branding?.name ?? 'KrikalOne'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: T.forest, display: 'inline-block' }} />
              <span style={{ ...mono, fontSize: 10.5, color: T.forest, fontWeight: 700, letterSpacing: '0.06em' }}>
                SUB ADMIN
              </span>
            </div>
            {userName && (
              <div style={{ ...body, fontSize: 12, color: '#8A8776', marginTop: 2 }} className="truncate">
                {userName}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...mono, fontSize: 10.5, color: '#605C4D', letterSpacing: '0.14em', padding: '0 10px 10px' }}>
          MENU
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 12px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,70,32,0.14)' : 'transparent',
                color: isActive ? '#FCFAF4' : '#B8B4A2',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                textAlign: 'left',
                borderLeft: isActive ? `3px solid ${T.signal}` : '3px solid transparent',
                textDecoration: 'none',
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} color={isActive ? T.signal : '#8A8776'} />
                  {item.label}
                  {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} color={T.signal} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '18px', borderTop: `1px solid ${T.inkLine}` }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              borderRadius: '12px',
              background: T.inkSoft,
              border: `1px solid ${T.inkLine}`,
            }}
          >
            <Trophy size={16} color={T.brass} />
            <div>
              <div style={{ ...mono, fontSize: 9.5, color: '#8A8776', letterSpacing: '0.08em' }}>GYM ID</div>
              <div style={{ ...display, fontSize: 15, color: '#FCFAF4' }}>{gymId ?? '—'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '28px 36px 60px', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...mono, fontSize: 12, color: T.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sub Admin / {activeLabel}
          </div>
          <button
            onClick={handleLogout}
            style={{
              ...body,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#fff',
              border: `1px solid ${T.line}`,
              color: T.signalDark,
              fontWeight: 700,
              fontSize: 13,
              padding: '9px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
            className="hover:brightness-105 hover:-translate-y-px transition-all"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>

        <Outlet />
      </main>
    </div>
  )
}
