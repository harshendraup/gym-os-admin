/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EDIT ME — every real-world detail shown on the public About / Contact pages
 *  lives in this one block. Swap the placeholders below for your real support
 *  address, phone numbers and social links; nothing else needs to change.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const siteContact = {
  brand: 'KrikalOne',
  tagline: 'Gym SaaS Management Platform',

  supportEmail: 'krikalone.offical@gmail.com',
  salesEmail: 'krikalone.offical@gmail.com',
  phone: '+91 7877419770',
  phoneHref: 'tel:+917877419770',
  whatsapp: '+91 7877419770',
  whatsappHref: 'https://wa.me/917877419770',

  address: {
    line1: 'B8B,',
    line2: 'Dhurav marg, Raja Park, Tilak nagar',
    city: 'Jaipur, Rajasthan 302004',
    country: 'India',
  },

  hours: [
    { days: 'Monday – Friday', time: '9:00 AM – 7:00 PM IST' },
    { days: 'Saturday', time: '10:00 AM – 4:00 PM IST' },
    { days: 'Sunday', time: 'Emergency support only' },
  ],

  socials: [
    { label: 'LinkedIn', href: 'https://linkedin.com' },
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'X', href: 'https://x.com' },
  ],
} as const

/** Response-time promise shown beside the contact form. */
export const responsePromise = {
  first: 'under 4 business hours',
  resolution: 'same business day for critical issues',
}

/** Reasons a gym owner might reach out — drives the contact form's subject list. */
export const contactTopics = [
  { value: 'demo', label: 'Book a product demo' },
  { value: 'onboarding', label: 'Onboarding a new gym' },
  { value: 'billing', label: 'Billing & subscriptions' },
  { value: 'technical', label: 'Technical issue / bug' },
  { value: 'account', label: 'Account or login help' },
  { value: 'partnership', label: 'Partnership enquiry' },
  { value: 'other', label: 'Something else' },
] as const

/** About page — the numbers strip under the hero. */
export const aboutStats = [
  { value: '3', suffix: '', label: 'Ways in', hint: 'Owner console, manager console, member app' },
  { value: '20', suffix: '+', label: 'Managed modules', hint: 'Members, plans, diets, payments & more' },
  { value: '1', suffix: '', label: 'Unified console', hint: 'Every branch and business in one place' },
  { value: '24', suffix: '/7', label: 'Platform uptime target', hint: 'Monitored around the clock' },
] as const

/** About page — what the platform is built around. */
export const aboutPrinciples = [
  {
    title: 'Data behind every decision',
    body: 'Attendance, body composition, performance and revenue live in the same system, so a retention call is backed by numbers instead of a hunch.',
  },
  {
    title: 'Built for multi-location reality',
    body: 'Businesses, branches and the people who run them are first-class concepts — not an afterthought bolted onto a single-gym tool.',
  },
  {
    title: 'Coaching, not just billing',
    body: 'Training programs, diet plans and nutrition assessments sit next to memberships, because members renew for results, not invoices.',
  },
  {
    title: 'Fast enough to use on the floor',
    body: 'The console is designed for people standing at a front desk mid-conversation, not for analysts with a spare afternoon.',
  },
] as const

/** About page — how the product came together. */
export const aboutTimeline = [
  { period: 'The problem', title: 'Spreadsheets running real businesses', body: 'Gym owners were stitching together WhatsApp groups, paper registers and three different apps to answer one question: is this member still coming?' },
  { period: 'The build', title: 'One console, three ways in', body: 'What began as a single dashboard became a platform with a console for the business owner, a console for the gym manager, and an app for the member — each showing only what that person needs.' },
  { period: 'The platform', title: 'AI-assisted coaching', body: 'Body-composition data and session metrics now feed nutrition and training recommendations, turning raw tracking into an actual coaching signal.' },
  { period: 'What is next', title: 'The member in your pocket', body: 'A white-label mobile app puts the same plans, check-ins and progress in the member’s hand, branded as the gym — not as us.' },
] as const


/**
 * About page — the cities gyms already run from.
 *
 * Ordered as the business lists them (Jaipur first — it is where the first
 * client operates), not alphabetically. `region` is shown under each city so
 * the reach reads as national rather than as eight names in a row; the count
 * of distinct regions is derived in the page, never hardcoded, so adding a
 * city here keeps the headline figure honest on its own.
 */
export const aboutCities = [
  { city: 'Jaipur', region: 'Rajasthan' },
  { city: 'Mumbai', region: 'Maharashtra' },
  { city: 'Surat', region: 'Gujarat' },
  { city: 'Bangalore', region: 'Karnataka' },
  { city: 'Bhopal', region: 'Madhya Pradesh' },
  { city: 'Pune', region: 'Maharashtra' },
  { city: 'Ahmedabad', region: 'Gujarat' },
  { city: 'Chandigarh', region: 'Chandigarh' },
] as const

/**
 * About page — the "Why choose KrikalOne" bento.
 *
 * `span: 'large'` marks the one card that fills the full height of the grid
 * on desktop. Exactly one should carry it: the whole point of the layout is
 * that a single card is obviously the headline, and two competing for that
 * role reads as a mistake rather than as emphasis.
 *
 * Claims here are limited to what the platform actually ships (the feature
 * scope in the service agreement) — no member counts, no uptime figures.
 */
export const aboutWhyUs: ReadonlyArray<{
  id: string
  /** Set on exactly one card — the headline tile in the bento. */
  span?: 'large'
  title: string
  body: string
  cta: string
  href: string
  image: string
}> = [
  {
    id: 'console',
    span: 'large',
    title: 'One console',
    body: 'Every branch, every member and every payment in a single place. Open a location, compare two of them, or check today’s collections without switching tools or exporting anything.',
    cta: 'See how it works',
    href: '/pricing',
    image: '/images/zym-creative-6.png',
  },
  {
    id: 'app',
    title: 'Your own app',
    body: 'A member app on Android and iOS carrying your gym’s name, logo and colours — not ours.',
    cta: 'View pricing',
    href: '/pricing',
    image: '/images/gym-creative-5.webp',
  },
  {
    id: 'coaching',
    title: 'Coaching built in',
    body: 'Training programs, diet plans and nutrition assessments, assigned per member and adjusted week to week.',
    cta: 'Explore features',
    href: '/pricing',
    image: '/images/gym-creative-2.webp',
  },
  {
    id: 'payments',
    title: 'Payments that reconcile',
    body: 'Plans, renewals and fees with a full payment history behind every member — so the follow-up call is never guesswork.',
    cta: 'See the plans',
    href: '/pricing',
    image: '/images/hero-gym.jpeg',
  },
  {
    id: 'analytics',
    title: 'Numbers that decide',
    body: 'Retention, revenue and attendance sliced by branch, plan or trainer — the report you would have built by hand.',
    cta: 'Talk to us',
    href: '/contact',
    image: '/images/hero-kitchen-scan.webp',
  },
]

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PRICING
 *
 *  Figures are the standard commercial pricing from the SaaS agreement
 *  (Sections 3 and 4). The /pricing page is layout only — every number,
 *  inclusion and term below is the single source, so a change to the rate
 *  card is an edit here and never a change to PricingPage.tsx.
 *
 *  GST-inclusive amounts are DERIVED from `gstPercent` at render time rather
 *  than stored: two copies of the same number drift the moment a rate moves,
 *  and a wrong tax figure on a public page is a commercial problem, not a
 *  cosmetic one.
 *
 *  Deliberately generic about dates. The agreement names a specific go-live
 *  for one client; this page states the schedule relative to signing and
 *  go-live so it stays true for every client who reads it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const pricingMeta = {
  gstPercent: 18,
  /** Users covered by the base subscription before Section 4.1 applies. */
  userCap: 200,
  /** Initial term in months, auto-renewing for the same period. */
  termMonths: 12,
  /** Notice required to stop a renewal, in days. */
  noticeDays: 30,
} as const

/** One-time build of the member apps. Both together are the usual purchase. */
export const pricingSetup = [
  { id: 'ios', label: 'iOS app', amount: 29999, note: 'Base iOS application, built and submitted to the App Store.' },
  { id: 'android', label: 'Android app', amount: 14999, note: 'Base Android application, built and submitted to Google Play.' },
] as const

/** The recurring platform fee. */
export const pricingSubscription = {
  amount: 2999,
  cap: `Up to ${pricingMeta.userCap} active members`,
  covers: 'Owner console, manager console and the member app',
  note: 'Billed monthly in advance, due by the 5th of each month.',
} as const

/** Quoted separately, only if asked for. */
export const pricingAddOns = [
  {
    id: 'website',
    label: 'Additional website',
    amount: 4999,
    type: 'Optional · one-time',
    note: 'A standalone public-facing website, beyond the member app.',
  },
] as const

/**
 * Third-party costs reimbursed at actual. Listed as prominently as the fees
 * we set: a store account charge that shows up unannounced on the first
 * invoice reads as a hidden cost, even when the contract always said so.
 */
export const pricingPassThrough = [
  { id: 'play', label: 'Google Play Store fee', note: 'Google’s developer account charge, at cost.' },
  { id: 'appstore', label: 'Apple App Store fee', note: 'Apple’s developer programme charge, at cost.' },
  { id: 'domain', label: 'Domain registration & renewal', note: 'Registrar charge for your domain, at cost.' },
] as const

/** Everything the platform fee covers. `icon` maps to a lucide icon in the page. */
export const pricingIncluded = [
  { icon: 'smartphone', title: 'Member mobile app', body: 'Android and iOS, published under your gym’s own brand.' },
  { icon: 'userPlus', title: 'Digital registration', body: 'Member sign-up and profile management, no paper register.' },
  { icon: 'layers', title: 'Plans & renewals', body: 'Membership plans, validity windows and renewal tracking.' },
  { icon: 'wallet', title: 'Payments & fees', body: 'Fee tracking with a full payment history per member.' },
  { icon: 'dashboard', title: 'Two dashboards', body: 'One for the member, one for whoever runs the gym.' },
  { icon: 'shield', title: 'Role-based access', body: 'Owners see every branch, managers see their own, members see themselves.' },
  { icon: 'bell', title: 'Member notifications', body: 'Push updates and announcements straight to your members.' },
  { icon: 'monitor', title: 'Responsive web console', body: 'Manage from a desk or a phone at the front desk.' },
  { icon: 'upload', title: 'App store deployment', body: 'We handle submission and review; store fees are at cost.' },
] as const

/** Section 4, stated relative to signing and go-live rather than fixed dates. */
export const pricingSchedule = [
  { step: '01', when: 'On signing', label: 'Setup advance', detail: '50% of the one-time platform setup fee.', amount: 22499 },
  { step: '02', when: 'On go-live', label: 'Setup balance', detail: 'The remaining 50%, due when the platform goes live.', amount: 22499 },
  { step: '03', when: 'On go-live', label: 'Month 1 subscription', detail: 'First month of the platform subscription.', amount: 2999 },
  { step: '04', when: '5th of each month', label: 'Month 2 onward', detail: 'Recurring subscription, billed monthly in advance.', amount: 2999, recurring: true },
] as const

/** Answers drawn from the agreement, so nothing here contradicts the contract. */
export const pricingFaqs = [
  {
    q: 'What does the one-time setup fee actually buy?',
    a: 'The build of your two member apps, including submission to the App Store and Google Play. Contact support for a tailored quote and payment schedule.',
  },
  {
    q: 'What happens if we go past 200 members?',
    a: 'We tell you, and the two of us agree an incremental user-tier fee in writing before it is applied. It is never charged retroactively and never applied silently.',
  },
  {
    q: 'Are the app store fees included?',
    a: 'No. Google Play, Apple App Store and domain charges are pass-through costs, invoiced to you at actual cost as and when they are incurred. We do not mark them up.',
  },
  {
    q: 'How long am I committed for?',
    a: 'Twelve months from go-live, then it renews automatically for further twelve-month periods. Either side can stop a renewal with thirty days’ written notice before the current term ends.',
  },
  {
    q: 'Is any of it refundable?',
    a: 'The setup fee is non-refundable once setup work has started, and unused prepaid subscription is non-refundable — except where you are terminating because of a material breach on our side that we failed to fix.',
  },
  {
    q: 'What support comes with it?',
    a: 'Email and chat support during standard business hours IST, with a commercially reasonable effort to respond to critical issues within one business day.',
  },
  {
    q: 'Who owns the member data?',
    a: 'You do. We use it only to run and support the platform, and on termination we provide a reasonable export of all of it within thirty days.',
  },
  {
    q: 'What is not covered?',
    a: 'Anything outside the feature scope above — extra integrations, custom development, or a standalone public website — is quoted and agreed separately as an addendum.',
  },
] as const
