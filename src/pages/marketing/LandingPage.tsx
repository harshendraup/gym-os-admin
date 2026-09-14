import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Dumbbell, Users, CreditCard, Salad, CalendarCheck,
  BarChart3, Layers, Building2, ArrowRight, Sparkles, Activity,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { heroImages } from '@/data/heroImages'
import { siteContact } from '@/data/siteContent'
import { MarketingNav, MarketingFooter, BrandLogo } from '@/components/marketing/MarketingShell'

const featureHighlights = [
  {
    image: '/images/gym-creative-2.webp',
    tag: 'AI Body Intelligence',
    title: 'Understand every member, not just their attendance.',
    body: 'Connect biometric and body-composition data to personalized nutrition and training recommendations — so coaching decisions are backed by real numbers, not guesswork.',
  },
  {
    image: '/images/Gym-creative-4.webp',
    tag: 'Real-Time Performance Tracking',
    title: 'Track power output and form, session by session.',
    body: 'Motion and effort metrics captured during every workout feed straight into member profiles, giving trainers a live view of progress and technique across the floor.',
  },
]

const platformFeatures = [
  { icon: Users, label: 'Member Management', desc: 'Full lifecycle tracking from sign-up to renewal.' },
  { icon: Layers, label: 'Memberships & Plans', desc: 'Flexible subscription tiers and billing cycles.' },
  { icon: CreditCard, label: 'Payments', desc: 'Automated invoicing and payment collection.' },
  { icon: CalendarCheck, label: 'Attendance', desc: 'Check-in tracking across every location.' },
  { icon: Dumbbell, label: 'Workout Plans', desc: 'Build and assign programs at scale.' },
  { icon: Salad, label: 'Diet Plans', desc: 'Nutrition programs tailored per member.' },
  { icon: BarChart3, label: 'Analytics', desc: 'Retention, revenue, and engagement in one view.' },
  { icon: Building2, label: 'Multi-Location Admin', desc: 'Manage every business from a single console.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [heroIdx, setHeroIdx] = useState(0)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % heroImages.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative min-h-screen text-white" style={{ background: '#0B0F1A' }}>
      <MarketingNav transparentUntilScroll />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden>
          {heroImages.map((img, i) => (
            <img
              key={img.src}
              src={img.src}
              alt={img.label}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
              style={{ opacity: i === heroIdx ? 1 : 0 }}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(11,15,26,0.35) 0%, rgba(11,15,26,0.55) 55%, #0B0F1A 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(140deg, rgba(35,19,39,0.5) 0%, rgba(26,35,48,0.4) 100%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 sm:px-10 pt-24">
          {/* The lockup carries the tagline "Gym SaaS Management Platform",
              which is why the headline below never has to repeat it. */}
          <BrandLogo size="lg" />

          <div
            className="mt-7 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold w-fit"
            style={{ background: 'rgba(191,115,53,0.28)', color: '#F3DDC6', backdropFilter: 'blur(8px)' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Driven Gym Management
          </div>
          <h1 className="mt-6 max-w-2xl text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
            AI driven tracking, coaching &amp; performance in one platform.
          </h1>
          <p className="mt-5 max-w-xl text-base sm:text-lg leading-7 drop-shadow" style={{ color: '#EFDAC8' }}>
            Manage businesses, memberships, and training from one unified dashboard, built for gym owners who want data behind every decision.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/auth/login')}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)',
                boxShadow: '0 8px 22px rgba(139,30,63,0.4)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/contact"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            >
              Talk to us
            </Link>
            <a
              href="#features"
              className="text-sm font-semibold underline-offset-4 hover:underline"
              style={{ color: '#C9D3DF' }}
            >
              See what's inside
            </a>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-14">
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
      </section>

      {/* ── Feature highlights (image + copy) ────────────────── */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 py-20 sm:py-28 space-y-20 sm:space-y-28">
        {featureHighlights.map((f, i) => (
          <div
            key={f.tag}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
          >
            <div className="rounded-3xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.12)', boxShadow: '0 32px 90px rgba(0,0,0,0.42)' }}>
              <img src={f.image} alt={f.tag} className="w-full h-full object-cover" style={{ maxHeight: '440px' }} />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold w-fit"
                style={{ background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }}
              >
                <Activity className="h-3.5 w-3.5" />
                {f.tag}
              </div>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold leading-snug">{f.title}</h2>
              <p className="mt-4 text-[15px] leading-7" style={{ color: '#C9D3DF' }}>{f.body}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Platform features grid ───────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 py-20 sm:py-28" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold">Everything your gym needs, in one console.</h2>
          <p className="mt-3 text-[15px] leading-7" style={{ color: '#C9D3DF' }}>
            From day-to-day member operations to multi-location oversight — {siteContact.brand} covers the full stack of running a modern fitness business.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {platformFeatures.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-6 hover-lift"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                style={{ background: 'rgba(191,115,53,0.2)' }}
              >
                <f.icon className="h-5 w-5" style={{ color: '#E7A66C' }} />
              </div>
              <h3 className="font-semibold text-[15px]">{f.label}</h3>
              <p className="mt-1.5 text-sm" style={{ color: '#A6B0C0' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 pb-24">
        <div
          className="rounded-3xl p-10 sm:p-14 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(139,30,63,0.35) 0%, rgba(59,130,246,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to run your gym on {siteContact.brand}?</h2>
          <p className="mt-3 text-[15px]" style={{ color: '#D7DEE8' }}>
            Sign in to your dashboard and pick up right where you left off — or{' '}
            <Link to="/about" className="font-semibold underline underline-offset-4" style={{ color: '#F3DDC6' }}>
              read what we built
            </Link>
            {' '}first.
          </p>
          <button
            onClick={() => navigate('/auth/login')}
            className="mt-7 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)',
              boxShadow: '0 8px 22px rgba(139,30,63,0.4)',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
