import { Bell, Search, ChevronDown, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/auth.store'
import { getInitials } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const user = useAuthStore((s) => s.user) as any
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="glass-header sticky top-0 z-20 flex h-16 items-center justify-between px-6 flex-shrink-0">
      <div>
        {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none"
            style={{ color: '#475569' }}
          />
          <input
            placeholder="Search..."
            className="w-56 rounded-xl pl-9 pr-4 py-2 text-sm outline-none transition-all duration-200 placeholder:text-slate-600"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94A3B8',
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(59,130,246,0.5)'
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255,255,255,0.08)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Bell */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-white/8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Bell className="h-4 w-4" style={{ color: '#94A3B8' }} />
          <span
            className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full"
            style={{ background: '#3B82F6' }}
          />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <div
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback
                className="text-[10px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                {getInitials(user?.fullName ?? 'U')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-white hidden md:block max-w-[120px] truncate">
              {user?.fullName?.split(' ')[0] ?? 'Admin'}
            </span>
            <ChevronDown className="h-3 w-3 hidden md:block flex-shrink-0" style={{ color: '#475569' }} />
          </div>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-40 rounded-xl overflow-hidden z-20"
                style={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors duration-150 hover:bg-white/5"
                  style={{ color: '#F87171' }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
