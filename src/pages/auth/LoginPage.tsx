import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { post } from '@/api/client'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { Eye, EyeOff, Dumbbell, Loader2 } from 'lucide-react'
import { heroImages } from '@/data/heroImages'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [heroIdx, setHeroIdx] = useState(0)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 4500)
    return () => clearInterval(t)
  }, [])

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-page background slideshow */}
      <div className="fixed inset-0" aria-hidden>
        {heroImages.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.label}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          />
        ))}

        {/* Dark overlay for text/form readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(140deg, rgba(35,19,39,0.72) 0%, rgba(26,35,48,0.72) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 80%, rgba(0,0,0,0.35) 0%, transparent 55%)',
          }}
        />
      </div>

      {/* Brand / copy — top-left corner over background */}
      <div className="fixed top-0 left-0 z-10 p-8 sm:p-10 lg:p-12 hidden lg:block max-w-md">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold w-fit"
          style={{ background: 'rgba(191,115,53,0.28)', color: '#F3DDC6', backdropFilter: 'blur(8px)' }}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          GymOS Platform
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold leading-tight text-white drop-shadow-lg">
          AI-driven tracking, coaching &amp; performance in one platform.
        </h1>
        <p className="mt-3 text-sm leading-7 max-w-sm drop-shadow" style={{ color: '#EFDAC8' }}>
          Manage businesses, memberships, and training from one unified dashboard.
        </p>
      </div>

      {/* Dot indicators — bottom-left over background */}
      <div className="fixed bottom-8 left-8 sm:left-10 lg:left-12 z-10 hidden lg:flex gap-2">
        {heroImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setHeroIdx(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === heroIdx ? '28px' : '8px',
              background: i === heroIdx ? '#BF7335' : 'rgba(255,255,255,0.35)',
            }}
          />
        ))}
      </div>

      {/* Login card — floats on top of the background */}
      <div className="relative z-10 w-full max-w-md p-4 animate-fade-in-up">
        <div
          className="rounded-3xl border p-6 sm:p-8 lg:p-10"
          style={{
            borderColor: 'rgba(255,255,255,0.14)',
            background: 'rgba(7,16,34,0.58)',
            boxShadow: '0 32px 90px rgba(0,0,0,0.42)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
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

          {/* Mobile dot indicators (background copy is hidden on small screens) */}
          <div className="flex lg:hidden justify-center gap-2 mt-6">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === heroIdx ? '28px' : '8px',
                  background: i === heroIdx ? '#BF7335' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
