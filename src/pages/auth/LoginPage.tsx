import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { post } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { Eye, EyeOff, Dumbbell, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  const from = (location.state as any)?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = '1px solid rgba(191,115,53,0.62)'
    e.target.style.boxShadow = '0 0 0 3px rgba(191,115,53,0.18)'
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = '1px solid rgba(191,115,53,0.24)'
    e.target.style.boxShadow = 'none'
  }

  const emailReg = register('email')
  const passwordReg = register('password')

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await post<{
        user: any
        accessToken: string
        refreshToken: string
        expiresIn: number
        gymContext: { gymId: string; role: string } | null
      }>('/auth/login', values)

      setAuth(result.user, result.accessToken, result.refreshToken, result.gymContext)
      navigate(from, { replace: true })
    } catch (error: any) {
      const msg = error.response?.data?.error?.message ?? 'Login failed. Check your credentials.'
      toast.error(msg)
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #231327 0%, #1A2330 100%)' }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(111,17,82,0.35) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-8%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(187,0,44,0.2) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '55%',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(21,88,104,0.26) 0%, transparent 65%)',
          filter: 'blur(48px)',
        }} />
      </div>

      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-3xl border animate-fade-in-up"
        style={{
          borderColor: 'rgba(255,255,255,0.14)',
          background: 'rgba(7,16,34,0.58)',
          boxShadow: '0 32px 90px rgba(0,0,0,0.42)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div
            className="relative overflow-hidden p-8 sm:p-10 lg:p-12"
            style={{
              background: 'linear-gradient(155deg, #5C164A 0%, #8B1E3F 50%, #1B5160 100%)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <svg
                className="absolute -bottom-6 left-0 h-56 w-full opacity-90"
                viewBox="0 0 1200 300"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,120 C180,220 340,20 540,110 C760,210 930,70 1200,170 L1200,300 L0,300 Z"
                  fill="rgba(191,115,53,0.28)"
                />
                <path
                  d="M0,170 C200,270 350,60 560,150 C770,240 970,110 1200,210 L1200,300 L0,300 Z"
                  fill="rgba(165,87,44,0.26)"
                />
              </svg>
              <svg
                className="absolute -top-2 right-0 h-44 w-full opacity-55"
                viewBox="0 0 1200 240"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,80 C220,10 420,180 620,90 C820,10 980,150 1200,70 L1200,0 L0,0 Z"
                  fill="rgba(27,81,96,0.32)"
                />
              </svg>
            </div>

            <div
              className="relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'rgba(191,115,53,0.2)', color: '#F3DDC6' }}
            >
              <Dumbbell className="h-3.5 w-3.5" />
              GymOS Platform
            </div>
            <h1 className="relative z-10 mt-6 text-3xl sm:text-4xl font-bold leading-tight text-white max-w-xl">
              AI-driven tracking, coaching, and performance management in one platform.
            </h1>
            <p className="relative z-10 mt-4 text-sm sm:text-[15px] leading-7 max-w-xl" style={{ color: '#EFDAC8' }}>
              Manage businesses, users, memberships, and training operations from one unified dashboard.
              Get cleaner workflows, clearer visibility, and faster team execution with role-based access.
            </p>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center text-center">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  boxShadow: '0 8px 32px rgba(59,130,246,0.35)',
                }}
              >
                <Dumbbell className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">GymOS Admin</h2>
              <p className="mt-1 text-sm" style={{ color: '#BF7335' }}>
                Sign in to manage your gym
              </p>
            </div>

            {/* Form card — liquid glass */}
            <div
              className="rounded-2xl p-8 space-y-5"
              style={{
                background: 'linear-gradient(148deg, rgba(191,115,53,0.08) 0%, rgba(191,115,53,0.03) 35%, transparent 65%), rgba(30,14,32,0.72)',
                backdropFilter: 'blur(48px) saturate(200%) brightness(1.05)',
                WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.05)',
                border: '1px solid rgba(191,115,53,0.28)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 1px 0 0 rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.22)',
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium" style={{ color: '#E7CBB2' }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="owner@mygym.com"
                    autoComplete="email"
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(191,115,53,0.08)',
                      border: '1px solid rgba(191,115,53,0.24)',
                    }}
                    {...emailReg}
                    onFocus={focusStyle}
                    onBlur={(e) => { emailReg.onBlur(e); blurStyle(e) }}
                  />
                  {errors.email && (
                    <p className="text-xs" style={{ color: '#EF4444' }}>{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium" style={{ color: '#E7CBB2' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(191,115,53,0.08)',
                        border: '1px solid rgba(191,115,53,0.24)',
                      }}
                      {...passwordReg}
                      onFocus={focusStyle}
                      onBlur={(e) => { passwordReg.onBlur(e); blurStyle(e) }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
                      style={{ color: '#475569' }}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />
                      }
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs" style={{ color: '#EF4444' }}>{errors.password.message}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[15px] font-semibold text-white transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: isSubmitting
                      ? 'rgba(139,30,63,0.82)'
                      : 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)',
                    boxShadow: '0 8px 22px rgba(139,30,63,0.32)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting)
                      (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  }}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: '#C9D3DF' }}>
              GymOS — Enterprise Gym Management Platform
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
