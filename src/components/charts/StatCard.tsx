import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray'
  change?: { value: number; label: string }
  alert?: boolean
}

const colorMap = {
  blue:   { icon: 'rgba(59,130,246,0.18)',  text: '#60A5FA', glow: 'rgba(59,130,246,0.28)',  hoverShadow: '0 0 40px rgba(59,130,246,0.18)'  },
  green:  { icon: 'rgba(34,197,94,0.18)',   text: '#4ADE80', glow: 'rgba(34,197,94,0.28)',   hoverShadow: '0 0 40px rgba(34,197,94,0.18)'   },
  purple: { icon: 'rgba(168,85,247,0.18)',  text: '#C084FC', glow: 'rgba(168,85,247,0.28)',  hoverShadow: '0 0 40px rgba(168,85,247,0.18)'  },
  amber:  { icon: 'rgba(245,158,11,0.18)',  text: '#FCD34D', glow: 'rgba(245,158,11,0.28)',  hoverShadow: '0 0 40px rgba(245,158,11,0.18)'  },
  red:    { icon: 'rgba(239,68,68,0.18)',   text: '#F87171', glow: 'rgba(239,68,68,0.28)',   hoverShadow: '0 0 40px rgba(239,68,68,0.18)'   },
  gray:   { icon: 'rgba(100,116,139,0.18)', text: '#94A3B8', glow: 'rgba(100,116,139,0.18)', hoverShadow: '0 0 40px rgba(100,116,139,0.10)' },
}

export function StatCard({ title, value, icon, color = 'blue', change, alert }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div
      className="glass-card rounded-2xl p-5 cursor-default"
      style={alert ? { borderColor: 'rgba(239,68,68,0.35)' } : {}}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = [
          'inset 0 1px 0 rgba(255,255,255,0.18)',
          'inset 0 -1px 0 rgba(0,0,0,0.08)',
          'inset 1px 0 0 rgba(255,255,255,0.08)',
          '0 28px 80px rgba(0,0,0,0.35)',
          '0 10px 28px rgba(0,0,0,0.18)',
          c.hoverShadow,
        ].join(', ')
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = ''
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: '#94A3B8' }}>
            {title}
          </p>
          <p className="mt-2.5 text-2xl font-bold text-white leading-none tracking-tight">
            {value}
          </p>
          {change && (
            <div className="mt-2.5 flex items-center gap-1">
              {change.value >= 0
                ? <TrendingUp className="h-3 w-3 text-green-400" />
                : <TrendingDown className="h-3 w-3 text-red-400" />
              }
              <p
                className="text-xs font-semibold"
                style={{ color: change.value >= 0 ? '#4ADE80' : '#F87171' }}
              >
                {change.value >= 0 ? '+' : ''}{change.value}% {change.label}
              </p>
            </div>
          )}
        </div>

        {/* Icon with glow ring */}
        <div className="relative flex-shrink-0">
          {/* Soft glow bloom behind icon */}
          <div style={{
            position: 'absolute',
            inset: '-6px',
            borderRadius: '20px',
            background: `radial-gradient(circle, ${c.glow} 0%, transparent 70%)`,
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }} />
          {/* Icon surface */}
          <div
            className="relative flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: c.icon,
              color: c.text,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px ${c.glow}`,
              border: `1px solid ${c.icon}`,
            }}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
