import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, ArrowRight, Check, ChevronDown, ShieldCheck, Receipt, Repeat,
  Smartphone, UserPlus, Layers, Wallet, LayoutDashboard, Bell, Monitor, UploadCloud,
} from 'lucide-react'
import { MarketingNav, MarketingFooter } from '@/components/marketing/MarketingShell'
import {
  pricingMeta,
  pricingSetup,
  pricingSubscription,
  pricingAddOns,
  pricingPassThrough,
  pricingIncluded,
  pricingSchedule,
  pricingFaqs,
  siteContact,
} from '@/data/siteContent'

/** Reveals children once they scroll into view — used for the section stagger. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity 700ms cubic-bezier(0.4,0,0.2,1) ${delay}ms, transform 700ms cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

const SETUP_TOTAL = pricingSetup.reduce((sum, item) => sum + item.amount, 0)

/** `icon` keys in siteContent kept as strings so the data file stays presentation-free. */
const INCLUDED_ICONS = {
  smartphone: Smartphone,
  userPlus: UserPlus,
  layers: Layers,
  wallet: Wallet,
  dashboard: LayoutDashboard,
  shield: ShieldCheck,
  bell: Bell,
  monitor: Monitor,
  upload: UploadCloud,
} as const

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <div
      className="rounded-2xl transition-colors duration-300"
      style={{
        background: open ? 'rgba(191,115,53,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${open ? 'rgba(191,115,53,0.28)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[15px] font-semibold">{q}</span>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 transition-transform duration-300"
          style={{ color: '#E7A66C', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <p className="px-6 pb-5 text-sm leading-7" style={{ color: '#A6B0C0' }}>
          {a}
        </p>
      )}
    </div>
  )
}

/**
 * Public pricing page.
 *
 * Two charges, not tiers: a one-time build of the member apps, then a monthly
 * platform fee. Every figure comes from `siteContent.ts`; this file only
 * decides how they are laid out.
 */
export default function PricingPage() {
  const price = (_amount: number) => 'Contact Support'

  return (
    <div className="min-h-screen text-white" style={{ background: '#0B0F1A' }}>
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, rgba(11,15,26,0.9) 0%, #0B0F1A 100%)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(circle at 70% 8%, rgba(59,130,246,0.26) 0%, transparent 55%)',
              animation: 'auroraDrift 18s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 text-center">
          <Reveal>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: 'rgba(191,115,53,0.28)', color: '#F3DDC6', backdropFilter: 'blur(8px)' }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pricing
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl sm:text-5xl font-bold leading-[1.1]">
              Build it once. Then one flat monthly fee.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-8" style={{ color: '#C9D3DF' }}>
              Two charges, no tiers and nothing locked behind an upgrade. You pay once to have your
              branded member apps built and published, then a single subscription to run the platform —
              every feature included from day one.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-10 flex flex-col items-center gap-3">
              <span className="text-xs font-semibold" style={{ color: '#E7A66C' }}>
                Contact support for a tailored quote
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── The two charges ───────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 pb-20 sm:pb-24">
        <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* Setup */}
          <Reveal>
            <div
              className="flex h-full flex-col rounded-2xl p-7 sm:p-8 hover-lift transition-all duration-300"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(59,130,246,0.18)' }}
                >
                  <Receipt className="h-4 w-4" style={{ color: '#93C5FD' }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                  Paid once
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Platform setup</h2>
              <p className="mt-1 text-sm" style={{ color: '#A6B0C0' }}>
                Your member apps, built and published under your own brand.
              </p>

              <div className="mt-6 space-y-2.5">
                {pricingSetup.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(0,0,0,0.22)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="mt-0.5 text-xs leading-5" style={{ color: '#8A93A3' }}>{item.note}</div>
                    </div>
                    <div className="flex-shrink-0 text-base font-bold" style={{ color: '#E7A66C' }}>
                      {price(item.amount)}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 flex items-baseline justify-between gap-4 rounded-xl px-4 py-4"
                style={{ background: 'rgba(191,115,53,0.12)', border: '1px solid rgba(191,115,53,0.3)' }}
              >
                <div>
                  <div className="text-sm font-semibold">Both platforms</div>
                  <div className="mt-0.5 text-xs" style={{ color: '#C9D3DF' }}>iOS and Android together</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#E7A66C' }}>{price(SETUP_TOTAL)}</div>
              </div>

              <p className="mt-4 text-xs leading-6" style={{ color: '#8A93A3' }}>
                Billed 50% on signing and 50% on go-live.
              </p>
            </div>
          </Reveal>

          {/* Subscription */}
          <Reveal delay={90}>
            <div
              className="relative flex h-full flex-col rounded-2xl p-7 sm:p-8 hover-lift transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(139,30,63,0.32) 0%, rgba(59,130,246,0.16) 100%)',
                border: '1px solid rgba(191,115,53,0.45)',
                boxShadow: '0 14px 40px rgba(139,30,63,0.28)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(191,115,53,0.28)' }}
                >
                  <Repeat className="h-4 w-4" style={{ color: '#F3DDC6' }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#F3DDC6' }}>
                  Every month
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Platform subscription</h2>
              <p className="mt-1 text-sm" style={{ color: '#C9D3DF' }}>
                Everything in the feature list below — no module sold separately.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl sm:text-5xl font-bold" style={{ color: '#E7A66C' }}>
                  {price(pricingSubscription.amount)}
                </span>
                <span className="text-sm" style={{ color: '#C9D3DF' }}>/month</span>
              </div>

              <div
                className="mt-6 space-y-1.5 rounded-xl px-4 py-3.5 text-xs leading-6"
                style={{ background: 'rgba(0,0,0,0.26)', color: '#C9D3DF' }}
              >
                <div>{pricingSubscription.cap}</div>
                <div>{pricingSubscription.covers}</div>
                <div>{pricingSubscription.note}</div>
              </div>

              <div className="flex-1" />

              <Link
                to="/contact"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold transition-transform duration-200 hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)',
                  boxShadow: '0 8px 22px rgba(139,30,63,0.4)',
                }}
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-center text-xs" style={{ color: '#C9D3DF' }}>
                Past {pricingMeta.userCap} members we agree a tier with you in writing first.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── What's included ───────────────────────────────────── */}
      <section
        className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 py-20 sm:py-24"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold">What the subscription covers.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: '#C9D3DF' }}>
            All of it, from month one. There is no higher tier holding a feature back.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pricingIncluded.map((item, i) => {
            const Icon = INCLUDED_ICONS[item.icon as keyof typeof INCLUDED_ICONS]
            return (
              <Reveal key={item.title} delay={i * 55}>
                <div
                  className="h-full rounded-2xl p-6 transition-all duration-300"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(191,115,53,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(191,115,53,0.32)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(191,115,53,0.2)' }}
                  >
                    {Icon && <Icon className="h-[18px] w-[18px]" style={{ color: '#E7A66C' }} />}
                  </div>
                  <h3 className="text-[15px] font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7" style={{ color: '#A6B0C0' }}>{item.body}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ── Add-ons & pass-through ────────────────────────────── */}
      <section
        className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 py-20 sm:py-24"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold">The other line items, up front.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: '#C9D3DF' }}>
            Optional extras, and the third-party charges we pass on at cost without a markup.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Reveal>
            <div
              className="h-full rounded-2xl p-7"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#E7A66C' }}>
                Optional add-ons
              </h3>
              <div className="mt-5 space-y-2.5">
                {pricingAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="flex items-start justify-between gap-4 rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(0,0,0,0.22)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{addOn.label}</div>
                      <div className="mt-0.5 text-xs leading-5" style={{ color: '#8A93A3' }}>
                        {addOn.type} · {addOn.note}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-base font-bold" style={{ color: '#E7A66C' }}>
                      {price(addOn.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={90}>
            <div
              className="h-full rounded-2xl p-7"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#93C5FD' }}>
                Billed at actual cost
              </h3>
              <div className="mt-5 space-y-2.5">
                {pricingPassThrough.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-xl px-4 py-3.5"
                    style={{ background: 'rgba(0,0,0,0.22)' }}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{item.label}</div>
                      <div className="mt-0.5 text-xs leading-5" style={{ color: '#8A93A3' }}>{item.note}</div>
                    </div>
                    <div className="flex-shrink-0 text-sm font-semibold" style={{ color: '#C9D3DF' }}>
                      At cost
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6" style={{ color: '#8A93A3' }}>
                These are Apple's, Google's and your registrar's charges — invoiced separately, as and
                when they are incurred.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Payment schedule ──────────────────────────────────── */}
      <section
        className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 py-20 sm:py-24"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold">When each payment falls due.</h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: '#C9D3DF' }}>
            The whole schedule, from signature to steady state. Contact support for current pricing.
          </p>
        </Reveal>

        <Reveal delay={100}>
          {/* Scrolls inside itself — the page body never scrolls sideways. */}
          <div
            className="mt-10 overflow-x-auto rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {['', 'When', 'What', 'Quote'].map((heading, i) => (
                    <th
                      key={heading || i}
                      className={`px-5 py-4 text-[13px] font-semibold uppercase tracking-wider ${i >= 3 ? 'text-right' : ''}`}
                      style={{ color: '#8A93A3' }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricingSchedule.map((row) => (
                  <tr key={row.step} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold"
                        style={{ background: 'rgba(191,115,53,0.2)', color: '#E7A66C' }}
                      >
                        {row.step}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium whitespace-nowrap">{row.when}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold">{row.label}</div>
                      <div className="mt-0.5 text-xs leading-5" style={{ color: '#8A93A3' }}>{row.detail}</div>
                    </td>
                    <td colSpan={3} className="px-5 py-4 text-right text-sm font-bold whitespace-nowrap" style={{ color: '#E7A66C' }}>
                      Contact Support
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              `${pricingMeta.termMonths}-month initial term from go-live`,
              `Auto-renews unless stopped ${pricingMeta.noticeDays} days before term end`,
              'Store and domain charges invoiced separately, at cost',
            ].map((note) => (
              <div
                key={note}
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs leading-6"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#A6B0C0' }}
              >
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: '#22C55E' }} />
                {note}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section
        className="relative z-10 mx-auto max-w-4xl px-6 sm:px-10 py-20 sm:py-24"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Reveal>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(59,130,246,0.18)', color: '#93C5FD' }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Before you ask
          </div>
          <h2 className="mt-5 text-2xl sm:text-3xl font-bold">Pricing questions, answered.</h2>
        </Reveal>

        <div className="mt-10 space-y-3">
          {pricingFaqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 50}>
              <FaqItem q={faq.q} a={faq.a} defaultOpen={i === 0} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 pb-24">
        <Reveal>
          <div
            className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(139,30,63,0.38) 0%, rgba(59,130,246,0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden
              style={{
                background: 'radial-gradient(circle at 20% 120%, rgba(191,115,53,0.35) 0%, transparent 55%)',
                animation: 'auroraDrift 16s ease-in-out infinite',
              }}
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to put your gym in members' pockets?</h2>
              <p className="mt-3 text-[15px]" style={{ color: '#D7DEE8' }}>
                Tell us how many branches and members you run and we will send you a written quote —
                setup, subscription and any store costs, itemised.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-transform duration-200 hover:scale-[1.03]"
                  style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)', boxShadow: '0 8px 22px rgba(139,30,63,0.4)' }}
                >
                  Request a quote
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={`mailto:${siteContact.salesEmail}`}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold transition-colors duration-200"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
                >
                  Email sales
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  )
}
