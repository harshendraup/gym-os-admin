import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, ArrowRight } from 'lucide-react'
import { siteContact } from '@/data/siteContent'

/**
 * Brand colours lifted from the supplied logo artwork: the orange the
 * wordmark's "One" is set in, and the near-black the rest of it uses.
 *
 * The navy is kept here for reference and is deliberately NOT used on this
 * site — at #272B36 against the #0B0F1A ground it is all but invisible, so
 * "Krikal" is set in white instead. It matters again the moment this lockup
 * is placed on a light surface.
 */
export const BRAND_ORANGE = '#F16F17'
export const BRAND_NAVY = '#272B36'

const LOCKUP_SIZES = {
  sm: { word: 17, tagline: 6, rule: 10, gap: 3 },
  md: { word: 22, tagline: 7, rule: 12, gap: 4 },
  lg: { word: 40, tagline: 10, rule: 18, gap: 8 },
} as const

/**
 * The brand lockup, using the KrikalOne logo image.
 */
export function BrandLogo({ size = 'md' }: { size?: keyof typeof LOCKUP_SIZES }) {
  const heights = { sm: 36, md: 44, lg: 64 } as const
  const height = heights[size]

  return (
    <img
      src="/logo/KrikalOne_logo.png"
      alt="KrikalOne"
      className="h-auto"
      style={{ height: `${height}px` }}
    />
  )
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact Us' },
]

/**
 * Nav + footer shared by every public page (landing, about, contact).
 *
 * `transparentUntilScroll` is for pages that open on a full-bleed hero — the
 * bar stays invisible over the image and fades into glass once the user
 * scrolls past it. Content pages get the solid bar immediately.
 */
export function MarketingNav({ transparentUntilScroll = false }: { transparentUntilScroll?: boolean }) {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(!transparentUntilScroll)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!transparentUntilScroll) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentUntilScroll])

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(9,13,24,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 sm:px-10 py-4">
        <Link
          to="/"
          aria-label={`${siteContact.brand} home`}
          className="flex items-center transition-transform duration-300 hover:scale-[1.04]"
        >
          <BrandLogo size="sm" />
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
              style={({ isActive }) => ({ color: isActive ? '#F3DDC6' : '#A6B0C0' })}
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <span
                    className="absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full transition-all duration-300"
                    style={{ background: '#BF7335', opacity: isActive ? 1 : 0 }}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/auth/login')}
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(12px)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
          >
            Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{
          maxHeight: menuOpen ? '260px' : '0px',
          background: 'rgba(9,13,24,0.94)',
          backdropFilter: 'blur(20px)',
          borderBottom: menuOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }}
      >
        <nav className="px-6 py-3 flex flex-col">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setMenuOpen(false)}
              className="py-3 text-sm font-medium border-b"
              style={({ isActive }) => ({
                color: isActive ? '#F3DDC6' : '#A6B0C0',
                borderColor: 'rgba(255,255,255,0.06)',
              })}
            >
              {l.label}
            </NavLink>
          ))}
          <button
            onClick={() => { setMenuOpen(false); navigate('/auth/login') }}
            className="mt-4 mb-2 rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #8B1E3F 0%, #A04D3A 100%)' }}
          >
            Sign In
          </button>
        </nav>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer
      className="relative z-10 px-6 sm:px-10 pt-14 pb-8"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="mx-auto max-w-7xl grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <BrandLogo size="md" />
          <p className="mt-4 max-w-sm text-sm leading-7" style={{ color: '#A6B0C0' }}>
            {siteContact.tagline} — memberships, coaching, payments and analytics for every branch you run,
            in one console.
          </p>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Platform</h4>
          <ul className="mt-4 space-y-2.5 text-sm" style={{ color: '#A6B0C0' }}>
            <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link to="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-wider text-white">Get in touch</h4>
          <ul className="mt-4 space-y-2.5 text-sm" style={{ color: '#A6B0C0' }}>
            <li>
              <a href={`mailto:${siteContact.supportEmail}`} className="hover:text-white transition-colors">
                {siteContact.supportEmail}
              </a>
            </li>
            <li>
              <a href={siteContact.phoneHref} className="hover:text-white transition-colors">
                {siteContact.phone}
              </a>
            </li>
            <li className="pt-1 leading-6">
              {siteContact.address.line2}<br />
              {siteContact.address.city}
            </li>
          </ul>
          <div className="mt-4 flex gap-3 text-xs" style={{ color: '#7C8798' }}>
            {siteContact.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mx-auto max-w-7xl mt-10 pt-6 text-xs flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#7C8798' }}
      >
        <span>© {new Date().getFullYear()} {siteContact.brand}. All rights reserved.</span>
        <span>{siteContact.tagline}</span>
      </div>
    </footer>
  )
}
