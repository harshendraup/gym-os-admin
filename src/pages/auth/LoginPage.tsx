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
    e.target.style.border = '1px solid rgba(59,130,246,0.5)'
    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'
  }
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.border = '1px solid rgba(255,255,255,0.08)'
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
      style={{ backgroundColor: '#060d1f' }}
    >
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div style={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-8%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.20) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: '55%',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 65%)',
          filter: 'blur(48px)',
        }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
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
          <h1 className="text-2xl font-bold text-white">GymOS Admin</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
            Sign in to manage your gym
          </p>
        </div>

        {/* Form card — liquid glass */}
        <div
          className="rounded-2xl p-8 space-y-5"
          style={{
            background: 'linear-gradient(148deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 35%, transparent 65%), rgba(8,18,40,0.58)',
            backdropFilter: 'blur(48px) saturate(200%) brightness(1.05)',
            WebkitBackdropFilter: 'blur(48px) saturate(200%) brightness(1.05)',
            border: '1px solid rgba(255,255,255,0.13)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 1px 0 0 rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.4), 0 12px 30px rgba(0,0,0,0.22)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium" style={{ color: '#94A3B8' }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="owner@mygym.com"
                autoComplete="email"
                className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
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
              <label className="block text-[13px] font-medium" style={{ color: '#94A3B8' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
                  ? 'rgba(59,130,246,0.7)'
                  : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
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

        <p className="mt-6 text-center text-xs" style={{ color: '#334155' }}>
          GymOS — Enterprise Gym Management Platform
        </p>
      </div>
    </div>
  )
}
