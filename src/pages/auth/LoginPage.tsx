import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { authApi } from '@/api/auth.api'
import { useAuthStore, buildGymContext } from '@/store/auth.store'
import { toast } from 'sonner'
import {
  Eye, EyeOff, Dumbbell, Loader2, Mail, Lock, ArrowRight,
  ShieldCheck, AlertTriangle, Check, ArrowLeft,
} from 'lucide-react'
import { heroImages } from '@/data/heroImages'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

const SLIDE_MS = 6000
const REMEMBER_KEY = 'gymos-remembered-email'

/** Copy that rotates in sync with the showcase image. */
const slideCopy = [
  { kicker: 'AI Body Intelligence', line: 'Coaching decisions backed by real numbers.' },
  { kicker: 'Smart Gym Operations', line: 'Every branch, every member, one console.' },
  { kicker: 'Composition Tracking', line: 'See progress the mirror never shows.' },
  { kicker: 'Real-Time Metrics', line: 'Power and effort captured set by set.' },
  { kicker: 'Form Coaching', line: 'Motion-tracked technique, session by session.' },
  { kicker: 'Built For Owners', line: 'Retention and revenue in the same view.' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [showPassword, setShowPassword] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [capsOn, setCapsOn] = useState(false)
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY))

  const from = (location.state as any)?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<FormValues>({
    mode: 'onTouched',
    defaultValues: { email: localStorage.getItem(REMEMBER_KEY) ?? '', password: '' },
    resolver: zodResolver(schema),
  })

  // Auto-advance the showcase; pauses while the pointer rests on the panel so
  // a slide can actually be read.
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), SLIDE_MS)
    return () => clearInterval(t)
  }, [paused])

  const emailValue = watch('email')
  const passwordValue = watch('password')
  const emailValid = useMemo(
    () => !!emailValue && z.string().email().safeParse(emailValue).success,
    [emailValue]
  )

  const emailReg = register('email')
  const passwordReg = register('password')

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await authApi.login(values)
      const gymContext = buildGymContext(result.user, result.role)

      if (remember) localStorage.setItem(REMEMBER_KEY, values.email)
      else localStorage.removeItem(REMEMBER_KEY)

      setAuth(result.user, result.token.token, null, gymContext)
      navigate(from, { replace: true })
    } catch (error: any) {
      const msg = error.response?.data?.message ?? 'Login failed. Check your credentials.'
      toast.error(msg)
    }
  }

  const copy = slideCopy[heroIdx] ?? slideCopy[0]

  return (
    <div className="relative min-h-screen w-full lg:grid lg:grid-cols-[1.1fr_1fr]" style={{ background: '#080C16' }}>
      {/* Full page background - single unified layer spanning entire grid */}
      <div className="absolute inset-0 lg:col-span-2" aria-hidden>
        {heroImages.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-out"
            style={{
              opacity: i === heroIdx ? 1 : 0,
              animation: i === heroIdx ? 'kenburns 12s ease-out both' : undefined,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(120deg, rgba(8,12,22,0.86) 0%, rgba(24,14,28,0.62) 45%, rgba(8,12,22,0.55) 100%)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 15% 90%, rgba(139,30,63,0.42) 0%, transparent 58%)' }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          LEFT — cinematic showcase (desktop) / backdrop (mobile)
      ═══════════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Brand */}
        <Link to="/" className="relative z-10 inline-flex items-center gap-2.5 w-fit group">
          <img
            src="/logo/KrikalOne_logo.png"
            alt="KrikalOne"
            className="h-14 w-auto transition-transform duration-300 group-hover:scale-110"
          />
        </Link>

        {/* Rotating copy */}
        <div className="relative z-10 max-w-lg">
          <div key={`k-${heroIdx}`} className="animate-fade-in-up">
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(191,115,53,0.26)', color: '#F3DDC6', backdropFilter: 'blur(8px)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E7A66C' }} />
              {copy.kicker}
            </div>
            <h1 className="mt-5 text-4xl xl:text-[2.9rem] font-bold leading-[1.15] text-white drop-shadow-xl">
              {copy.line}
            </h1>
          </div>
          <p className="mt-5 max-w-md text-[15px] leading-7" style={{ color: '#C3B0A2' }}>
            Manage businesses, memberships and training from one unified dashboard — built for gym
            owners who want data behind every decision.
          </p>

          {/* Slide progress bars */}
          <div className="mt-10 flex gap-2">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                aria-label={`Show slide ${i + 1}`}
                className="group relative h-1 flex-1 max-w-[56px] overflow-hidden rounded-full transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.18)' }}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: '#BF7335',
                    width: i === heroIdx ? '100%' : '0%',
                    transition: i === heroIdx ? `width ${SLIDE_MS}ms linear` : 'width 200ms ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <div className="relative z-10 flex items-center gap-6 text-xs" style={{ color: '#8A93A3' }}>
          <span>© {new Date().getFullYear()} KrikalOne</span>
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT — the form
      ═══════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center justify-center px-5 py-10 sm:px-8">
        {/* Mobile backdrop overlay */}
        <div className="absolute inset-0 lg:hidden" aria-hidden>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, rgba(8,12,22,0.82) 0%, rgba(24,14,28,0.9) 100%)' }}
          />
        </div>

        {/* Ambient glow behind the card on desktop */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          aria-hidden
          style={{ background: 'radial-gradient(circle at 60% 40%, rgba(139,30,63,0.16) 0%, transparent 60%)' }}
        />

        <div className="relative z-10 w-full max-w-[420px] animate-fade-in-up">
          {/* Back to site — replaces the desktop brand block on mobile */}
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-xs font-medium transition-colors lg:hidden"
            style={{ color: '#A6B0C0' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to KrikalOne.app
          </Link>

          <div
            className="rounded-3xl p-7 sm:p-9"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow:
                '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Header */}
            <div className="mb-7">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl lg:hidden"
                style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 10px 30px rgba(59,130,246,0.4)' }}
              >
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-[26px] font-bold leading-tight text-white">Welcome back</h2>
              <p className="mt-1.5 text-sm" style={{ color: '#93A0B4' }}>
                Sign in to your KrikalOne admin console.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* ── Email ─────────────────────────────────────── */}
              <Field
                label="Email address"
                error={errors.email?.message}
                valid={emailValid && !!touchedFields.email && !errors.email}
              >
                {({ inputClass, inputStyle, onFocus, onBlur }) => (
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: 'rgba(191,115,53,0.75)' }}
                    />
                    <input
                      type="email"
                      placeholder="owner@mygym.com"
                      autoComplete="email"
                      autoFocus
                      className={`${inputClass} pl-11 pr-10`}
                      style={inputStyle}
                      {...emailReg}
                      onFocus={onFocus}
                      onBlur={(e) => { emailReg.onBlur(e); onBlur(e) }}
                    />
                    {emailValid && (
                      <Check className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#22C55E' }} />
                    )}
                  </div>
                )}
              </Field>

              {/* ── Password ──────────────────────────────────── */}
              <Field label="Password" error={errors.password?.message}>
                {({ inputClass, inputStyle, onFocus, onBlur }) => (
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: 'rgba(191,115,53,0.75)' }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={`${inputClass} pl-11 pr-11`}
                      style={inputStyle}
                      {...passwordReg}
                      onKeyUp={(e) => setCapsOn(e.getModifierState?.('CapsLock') ?? false)}
                      onFocus={onFocus}
                      onBlur={(e) => { passwordReg.onBlur(e); setCapsOn(false); onBlur(e) }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors"
                      style={{ color: '#6B7787' }}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#E7A66C' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7787' }}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>

              {capsOn && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs animate-fade-in"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)', color: '#FBBF24' }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Caps Lock is on
                </div>
              )}

              {/* ── Remember / forgot ─────────────────────────── */}
              <div className="flex items-center justify-between pt-0.5">
                <button
                  type="button"
                  onClick={() => setRemember((v) => !v)}
                  className="flex items-center gap-2.5 text-[13px] transition-colors"
                  style={{ color: remember ? '#E7CBB2' : '#8A93A3' }}
                >
                  <span
                    className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px] transition-all duration-200"
                    style={{
                      background: remember ? 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${remember ? 'rgba(191,115,53,0.6)' : 'rgba(255,255,255,0.16)'}`,
                    }}
                  >
                    {remember && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  Remember me
                </button>

                <Link
                  to="/contact"
                  className="text-[13px] font-medium transition-colors"
                  style={{ color: '#BF7335' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#E7A66C' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#BF7335' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* ── Submit ────────────────────────────────────── */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full overflow-hidden rounded-xl py-3 text-[15px] font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)',
                  boxShadow: '0 10px 30px rgba(139,30,63,0.38)',
                }}
                onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {/* Light sweep on hover */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 group-hover:translate-x-full"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)' }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing you in…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>

              {/* Progress hint while the two fields fill in */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(emailValid ? 50 : 0) + ((passwordValue?.length ?? 0) >= 8 ? 50 : 0)}%`,
                      background: 'linear-gradient(90deg, #BF7335, #8B1E3F)',
                    }}
                  />
                </div>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#6B7787' }}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure sign-in
                </span>
              </div>
            </form>
          </div>

          {/* Below-card links */}
          <p className="mt-6 text-center text-xs leading-6" style={{ color: '#7C8798' }}>
            Trouble signing in?{' '}
            <Link to="/contact" className="font-medium transition-colors" style={{ color: '#BF7335' }}>
              Contact support
            </Link>
            {' · '}
            <Link to="/about" className="font-medium transition-colors" style={{ color: '#BF7335' }}>
              About KrikalOne
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Field — owns the label, the focus/blur ring styling and the error slot so
   each input in the form stays a single readable block.
───────────────────────────────────────────────────────────────────────────── */
type FieldRender = (args: {
  inputClass: string
  inputStyle: React.CSSProperties
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
}) => React.ReactNode

function Field({
  label,
  error,
  valid,
  children,
}: {
  label: string
  error?: string
  valid?: boolean
  children: FieldRender
}) {
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? 'rgba(239,68,68,0.55)'
    : focused
      ? 'rgba(191,115,53,0.68)'
      : valid
        ? 'rgba(34,197,94,0.34)'
        : 'rgba(255,255,255,0.10)'

  return (
    <div className="space-y-1.5">
      <label className="block text-[12.5px] font-medium tracking-wide" style={{ color: error ? '#F0A5A5' : '#B9C2D0' }}>
        {label}
      </label>
      {children({
        inputClass:
          'w-full rounded-xl py-3 text-sm text-white outline-none transition-all duration-200 placeholder:text-[#5A6474]',
        inputStyle: {
          background: focused ? 'rgba(191,115,53,0.10)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${borderColor}`,
          boxShadow: error
            ? '0 0 0 3px rgba(239,68,68,0.14)'
            : focused
              ? '0 0 0 3px rgba(191,115,53,0.16)'
              : 'none',
        },
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
      })}
      {error && (
        <p className="flex items-center gap-1.5 text-[11.5px] animate-fade-in" style={{ color: '#F87171' }}>
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
