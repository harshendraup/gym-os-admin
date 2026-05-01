import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/toaster'
import { useGymStore } from '@/store/gym.store'

export default function AppLayout() {
  const branding = useGymStore((s) => s.branding)

  return (
    <div
      className="relative flex h-screen overflow-hidden"
      style={{ backgroundColor: '#060d1f' }}
    >
      <style>{`
        :root {
          --color-primary: ${branding?.primaryColor ?? '#3B82F6'};
          --color-secondary: ${branding?.secondaryColor ?? '#22C55E'};
          --color-accent: ${branding?.accentColor ?? '#F59E0B'};
        }
      `}</style>

      {/* ── Ambient colour orbs (what the glass blurs through) ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden
      >
        {/* Blue — top-left */}
        <div style={{
          position: 'absolute',
          top: '-18%',
          left: '-8%',
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(59,130,246,0.22) 0%, transparent 68%)',
          filter: 'blur(32px)',
        }} />
        {/* Purple — bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: '-22%',
          right: '-6%',
          width: '620px',
          height: '620px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(139,92,246,0.18) 0%, transparent 68%)',
          filter: 'blur(32px)',
        }} />
        {/* Teal — mid-right */}
        <div style={{
          position: 'absolute',
          top: '30%',
          right: '15%',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(20,184,166,0.12) 0%, transparent 68%)',
          filter: 'blur(48px)',
        }} />
        {/* Rose — bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: '5%',
          left: '20%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(244,63,94,0.09) 0%, transparent 68%)',
          filter: 'blur(48px)',
        }} />
      </div>

      {/* ── Main content (above orbs) ── */}
      <div
        className="relative flex w-full h-full"
        style={{ zIndex: 1 }}
      >
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
