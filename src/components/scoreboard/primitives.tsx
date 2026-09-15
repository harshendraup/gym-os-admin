import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ImageOff, AlertTriangle, RefreshCw } from 'lucide-react'
import { T, display, mono, body } from './tokens'

/** Small uppercase status pill — dot + label, tone-colored. */
export function StatusPill({ children, tone = 'forest' }: { children: ReactNode; tone?: 'forest' | 'amber' | 'signal' }) {
  const tones = {
    forest: { bg: '#E9F3EC', fg: T.forest },
    amber: { bg: '#FBF0E3', fg: T.amber },
    signal: { bg: '#FEEAE3', fg: T.signalDark },
  }
  const c = tones[tone]
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        ...mono,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '5px 10px',
        borderRadius: '999px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: c.fg, display: 'inline-block' }} />
      {children}
    </span>
  )
}

/**
 * Hero banner. No real photography is wired in yet — pass `image` (a
 * `/public` path) once real photos exist; until then it renders an obvious
 * placeholder panel instead of silently showing nothing or a stock photo.
 */
export function Hero({
  image,
  placeholderLabel,
  eyebrow,
  title,
  subtitle,
  chips,
}: {
  image?: string | null
  placeholderLabel: string
  eyebrow: string
  title: string
  subtitle: string
  chips?: ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        minHeight: '220px',
        marginBottom: '28px',
        boxShadow: '0 20px 40px -20px rgba(20,20,15,0.35)',
        background: T.ink,
      }}
    >
      {image ? (
        <img src={image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: `1px dashed ${T.inkLine}`,
          }}
        >
          <ImageOff size={26} color={T.inkLine} />
          <span style={{ ...mono, fontSize: 10, color: T.inkLine, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 260 }}>
            Image placeholder — replace with {placeholderLabel} photo
          </span>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(100deg, rgba(20,20,15,0.94) 20%, rgba(20,20,15,0.75) 55%, rgba(20,20,15,0.25) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,70,32,0.06) 0px, rgba(255,70,32,0.06) 1px, transparent 1px, transparent 14px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          padding: '36px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '220px',
          maxWidth: '640px',
        }}
      >
        <div style={{ ...mono, color: T.brass, fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {eyebrow}
        </div>
        <h1 style={{ ...display, color: '#FCFAF4', fontSize: '44px', lineHeight: '0.95', margin: 0, textTransform: 'uppercase' }}>
          {title}
        </h1>
        <p style={{ ...body, color: '#D9D5C6', fontSize: '15px', marginTop: '12px', marginBottom: chips ? '20px' : 0, maxWidth: '460px' }}>
          {subtitle}
        </p>
        {chips && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{chips}</div>}
      </div>
    </div>
  )
}

export function HeroChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span
      style={{
        ...body,
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        color: T.chalk,
        fontSize: '12.5px',
        fontWeight: 600,
        padding: '7px 13px',
        borderRadius: '999px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Icon size={13} style={{ marginRight: 6 }} />
      {children}
    </span>
  )
}

export function StatPlate({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: ReactNode; accent: string }) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.line}`,
        borderRadius: '18px',
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', right: '-30px', top: '-30px', width: '110px', height: '110px', borderRadius: '999px', border: `10px solid ${accent}14` }} />
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '999px',
          background: T.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `3px solid ${accent}`,
        }}
      >
        <Icon size={22} color={accent} strokeWidth={2.2} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ ...mono, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.dim, marginBottom: '4px' }}>
          {label}
        </div>
        <div style={{ ...display, fontSize: '34px', color: T.text }}>{value}</div>
      </div>
    </div>
  )
}

export function InfoPlate({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div
      style={{
        background: T.ink,
        borderRadius: '18px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
        border: `1px solid ${T.inkLine}`,
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'rgba(255,70,32,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={T.signal} />
      </div>
      <div className="min-w-0">
        <div style={{ ...mono, fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8776', marginBottom: '3px' }}>
          {label}
        </div>
        <div style={{ ...body, fontWeight: 700, color: '#FCFAF4', fontSize: '16px' }} className="truncate">
          {value}
        </div>
      </div>
    </div>
  )
}

export function ScoreCard({ title, subtitle, children, action, transparent = false }: { title: string; subtitle?: ReactNode; children: ReactNode; action?: ReactNode; transparent?: boolean }) {
  return (
    <div style={{ background: transparent ? 'rgba(255, 255, 255, 0.75)' : T.card, border: transparent ? '1px solid rgba(226, 232, 240, 0.8)' : `1px solid ${T.line}`, borderRadius: '18px', padding: '22px 22px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ ...display, fontSize: '17px', color: T.text, textTransform: 'uppercase' }}>{title}</div>
          {subtitle && <div style={{ ...body, fontSize: '12.5px', color: T.dim, marginTop: '2px' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function ScoreboardCta({ icon: Icon, children, onClick }: { icon: LucideIcon; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...body,
        background: T.signal,
        color: '#fff',
        border: 'none',
        fontWeight: 700,
        fontSize: 13,
        padding: '10px 16px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        boxShadow: '0 8px 18px -8px rgba(255,70,32,0.55)',
      }}
      className="hover:brightness-105 hover:-translate-y-px transition-all"
    >
      <Icon size={15} strokeWidth={2.5} /> {children}
    </button>
  )
}

export function ScoreboardIconButton({ icon: Icon, onClick, disabled, label }: { icon: LucideIcon; onClick?: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: label ? 'auto' : 36,
        height: 36,
        borderRadius: '10px',
        border: `1px solid ${T.line}`,
        background: '#fff',
        color: T.signalDark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        gap: label ? 6 : 0,
        padding: label ? '8px 14px' : 0,
      }}
      className="hover:brightness-105 hover:-translate-y-px transition-all"
    >
      <Icon size={label ? 14 : 16} />
      {label}
    </button>
  )
}

/** Row-card list wrapper, with the loading/empty/error states the old DataTable used to own. */
export function RowCardList({
  children,
  isLoading,
  isError,
  isEmpty,
  emptyMessage,
  errorMessage = 'Something went wrong while loading this data.',
  onRetry,
}: {
  children: ReactNode
  isLoading: boolean
  isError?: boolean
  isEmpty: boolean
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
}) {
  if (isError) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: '48px 0',
          border: `1px solid ${T.line}`,
          borderRadius: 14,
          background: '#FBFAF6',
        }}
      >
        <AlertTriangle size={24} color={T.signalDark} />
        <p style={{ ...body, fontSize: 13.5, color: T.signalDark }}>{errorMessage}</p>
        {onRetry && (
          <ScoreboardIconButton icon={RefreshCw} onClick={onRetry} label="Retry" />
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 68, borderRadius: 14, border: `1px solid ${T.line}`, background: '#FBFAF6', opacity: 0.6 }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div
        style={{
          padding: '40px 0',
          textAlign: 'center',
          border: `1px dashed ${T.line}`,
          borderRadius: 14,
          ...body,
          fontSize: 13.5,
          color: T.dim,
        }}
      >
        {emptyMessage ?? 'Nothing here yet.'}
      </div>
    )
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 6 }}>{children}</div>
}

export function RowCard({ children, columns }: { children: ReactNode; columns: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: columns,
        alignItems: 'center',
        gap: '16px',
        padding: '16px 18px',
        borderRadius: '14px',
        border: `1px solid ${T.line}`,
        background: '#FBFAF6',
      }}
    >
      {children}
    </div>
  )
}

export function Avatar({ initials, tone = 'ink' }: { initials: string; tone?: 'ink' | 'forest' }) {
  const isInk = tone === 'ink'
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: isInk ? T.ink : T.forest,
        color: isInk ? T.brass : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...display,
        fontSize: 15,
        flexShrink: 0,
        border: isInk ? `2px solid ${T.brass}` : undefined,
      }}
    >
      {initials}
    </div>
  )
}
