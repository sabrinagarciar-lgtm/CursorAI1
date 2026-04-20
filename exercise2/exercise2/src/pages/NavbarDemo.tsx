import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { NavItem, UserProfile } from '../types/navigation';

/* ─── Nav config ─────────────────────────────────────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '#home',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Features',
    href: '#features',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Docs',
    href: '#docs',
    badge: 3,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Pricing',
    href: '#pricing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'About',
    href: '#about',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const USER: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  role: 'Admin',
};

/* ─── Feature cards data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'indigo',
    title: 'Sticky on Scroll',
    description: 'The navbar smoothly transitions to a frosted-glass, shadow-elevated state after 10 px of scroll — keeping it present without being intrusive.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'purple',
    title: 'Mobile Hamburger Menu',
    description: 'A fully-animated slide-in drawer takes over on small screens. The hamburger icon morphs into an ✕ with smooth CSS transforms.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'blue',
    title: 'Expanding Search Bar',
    description: 'The search input expands on focus and collapses when idle. Press Enter or submit to trigger the onSearch callback.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'rose',
    title: 'User Profile Dropdown',
    description: 'Click the avatar to open an animated dropdown with user info, navigation items, dividers, and a danger-styled sign-out action.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: 'emerald',
    title: 'Active Link Highlighting',
    description: 'A sliding underline indicator tracks the active route. Hash changes and smooth-scroll clicks both update the active state in real time.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'amber',
    title: 'Scroll Progress Bar',
    description: 'A gradient progress bar (indigo → purple → pink) along the bottom of the navbar reflects how far the user has scrolled through the page.',
  },
];

/* ─── Docs / API props table ─────────────────────────────────────────────── */

const PROPS = [
  { name: 'navItems', type: 'NavItem[]', required: true, description: 'Array of navigation links to render.' },
  { name: 'logoText', type: 'string', required: false, description: 'Brand text displayed next to the logo icon.' },
  { name: 'logo', type: 'ReactNode', required: false, description: 'Custom logo element — overrides the default icon.' },
  { name: 'user', type: 'UserProfile', required: false, description: 'When provided, shows the user avatar and dropdown.' },
  { name: 'onSearch', type: '(query: string) => void', required: false, description: 'Called when the user submits the search form.' },
  { name: 'onLogoClick', type: '() => void', required: false, description: 'Called when the logo / brand text is clicked.' },
  { name: 'className', type: 'string', required: false, description: 'Extra Tailwind classes applied to the <header> element.' },
];

/* ─── Pricing plans ──────────────────────────────────────────────────────── */

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for side projects and personal use.',
    features: ['Up to 3 nav items', 'Basic search', 'Responsive layout', 'MIT licensed'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    description: 'For teams that need more power and customisation.',
    features: ['Unlimited nav items', 'User dropdown', 'Badge support', 'Scroll progress bar', 'Priority support'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'White-glove onboarding and SLA-backed support.',
    features: ['Everything in Pro', 'Custom theming', 'SSO / SAML', 'Dedicated account manager'],
    cta: 'Contact sales',
    highlight: false,
  },
];

/* ─── Team members ───────────────────────────────────────────────────────── */

const TEAM = [
  { name: 'Alex Johnson', role: 'Founder & CEO', initials: 'AJ', from: 'from-indigo-500', to: 'to-purple-600' },
  { name: 'Maria Chen', role: 'Lead Engineer', initials: 'MC', from: 'from-blue-500', to: 'to-cyan-600' },
  { name: 'Sam Rivera', role: 'Product Design', initials: 'SR', from: 'from-rose-500', to: 'to-pink-600' },
  { name: 'Jordan Lee', role: 'Dev Relations', initials: 'JL', from: 'from-emerald-500', to: 'to-teal-600' },
];

/* ─── Color helpers ──────────────────────────────────────────────────────── */

const ICON_COLORS: Record<string, string> = {
  indigo:  'bg-indigo-100 text-indigo-600',
  purple:  'bg-purple-100 text-purple-600',
  blue:    'bg-blue-100 text-blue-600',
  rose:    'bg-rose-100 text-rose-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  amber:   'bg-amber-100 text-amber-600',
};

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function NavbarDemo() {
  const [searchToast, setSearchToast] = useState<string | null>(null);

  function handleSearch(query: string) {
    setSearchToast(query);
    setTimeout(() => setSearchToast(null), 4000);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ── */}
      <Navbar
        logoText="Acme Co."
        navItems={NAV_ITEMS}
        user={USER}
        onSearch={handleSearch}
        onLogoClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* ── Search toast ── */}
      {searchToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white
            px-5 py-3 rounded-full text-sm shadow-xl flex items-center gap-2.5"
        >
          <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Searching for <strong className="text-indigo-300 mx-1">&ldquo;{searchToast}&rdquo;</strong>
          <button onClick={() => setSearchToast(null)} className="ml-1 text-gray-500 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <main>
        {/* ══════════════════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════════════════ */}
        <section
          id="home"
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
            min-h-screen flex items-center"
        >
          {/* Background orbs */}
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
              bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              React 19 · TypeScript · Tailwind CSS
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              A navbar that{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                actually works
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Sticky on scroll, responsive on every screen, animated throughout.
              Includes search, user dropdown, badge support, and a live scroll-progress bar.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm
                  hover:bg-indigo-500 transition-colors duration-150 shadow-lg shadow-indigo-900/50"
              >
                Explore features
              </a>
              <a
                href="#docs"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('docs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold text-sm
                  hover:bg-white/20 transition-colors duration-150 ring-1 ring-white/20"
              >
                Read the docs
              </a>
            </div>

            {/* Mini feature badges */}
            <div className="mt-16 flex flex-wrap justify-center gap-3">
              {['Sticky navbar', 'Mobile drawer', 'Search bar', 'User dropdown', 'Active links', 'Scroll progress'].map((f) => (
                <span key={f}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-slate-400
                    ring-1 ring-white/10">
                  ✓ {f}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FEATURES
        ══════════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 mb-4">
                What's inside
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Built-in features</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                Every piece of the navbar is interactive — try the hamburger, the search, and the
                user avatar above to see them all in action.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title}
                  className="bg-white rounded-2xl p-6 ring-1 ring-gray-100 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${ICON_COLORS[f.color]}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            DOCS — component API
        ══════════════════════════════════════════════════════════════════ */}
        <section id="docs" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 mb-4">
                API reference
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Component props</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                Drop <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">&lt;Navbar /&gt;</code> anywhere
                and configure it entirely through props.
              </p>
            </div>

            {/* Props table */}
            <div className="rounded-2xl ring-1 ring-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-700">Prop</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden sm:table-cell">Type</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-700 hidden md:table-cell">Required</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {PROPS.map((p, i) => (
                    <tr key={p.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-5 py-3.5 font-mono font-medium text-indigo-700">{p.name}</td>
                      <td className="px-5 py-3.5 font-mono text-gray-500 hidden sm:table-cell text-xs">{p.type}</td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        {p.required
                          ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 ring-1 ring-rose-100">required</span>
                          : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">optional</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick-start snippet */}
            <div className="mt-10 rounded-2xl bg-slate-900 overflow-hidden ring-1 ring-slate-700 shadow-xl">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/60">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="ml-3 text-xs text-slate-500 font-mono">App.tsx</span>
              </div>
              <pre className="px-6 py-5 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
                <span className="text-slate-500">{'// Quick-start example\n'}</span>
                <span className="text-purple-400">{'import '}</span>
                <span className="text-slate-200">{'Navbar '}</span>
                <span className="text-purple-400">{'from '}</span>
                <span className="text-emerald-400">{'\'./components/Navbar\''}</span>
                <span className="text-slate-200">{';\n\n'}</span>
                <span className="text-slate-500">{'// Define your links\n'}</span>
                <span className="text-purple-400">{'const '}</span>
                <span className="text-blue-300">{'navItems'}</span>
                <span className="text-slate-200">{' = [\n'}</span>
                <span className="text-slate-200">{'  { label: '}</span>
                <span className="text-emerald-400">{'\'Home\''}</span>
                <span className="text-slate-200">{', href: '}</span>
                <span className="text-emerald-400">{'\'#home\''}</span>
                <span className="text-slate-200">{' },\n'}</span>
                <span className="text-slate-200">{'  { label: '}</span>
                <span className="text-emerald-400">{'\'Features\''}</span>
                <span className="text-slate-200">{', href: '}</span>
                <span className="text-emerald-400">{'\'#features\''}</span>
                <span className="text-slate-200">{', badge: 3 },\n'}</span>
                <span className="text-slate-200">{'];\n\n'}</span>
                <span className="text-slate-500">{'// Drop it anywhere at the top of your layout\n'}</span>
                <span className="text-purple-400">{'export default function '}</span>
                <span className="text-yellow-300">{'App'}</span>
                <span className="text-slate-200">{'() {\n'}</span>
                <span className="text-purple-400">{'  return '}</span>
                <span className="text-slate-200">{'<'}</span>
                <span className="text-blue-300">{'Navbar'}</span>
                <span className="text-amber-300">{'\n    logoText'}</span>
                <span className="text-slate-200">{'='}</span>
                <span className="text-emerald-400">{'\"Acme Co.\"'}</span>
                <span className="text-amber-300">{'\n    navItems'}</span>
                <span className="text-slate-200">{'={navItems}'}</span>
                <span className="text-amber-300">{'\n    user'}</span>
                <span className="text-slate-200">{'={currentUser}'}</span>
                <span className="text-amber-300">{'\n    onSearch'}</span>
                <span className="text-slate-200">{'={handleSearch}'}</span>
                <span className="text-slate-200">{'\n  />;\n}'}</span>
              </pre>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-24 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                bg-amber-50 text-amber-700 ring-1 ring-amber-100 mb-4">
                Simple pricing
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Pick your plan</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                All plans include the core navbar. Upgrade for advanced features and support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-7 flex flex-col
                    ${plan.highlight
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-xl shadow-indigo-200'
                      : 'bg-white text-gray-900 ring-1 ring-gray-100 shadow-sm'}`}
                >
                  {plan.highlight && (
                    <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-bold
                      bg-white/20 text-white ring-1 ring-white/30 mb-4">
                      Most popular
                    </span>
                  )}
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.price !== 'Custom' && (
                      <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-indigo-300' : 'text-gray-400'}`}>
                        / {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <svg className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-indigo-300' : 'text-indigo-500'}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                      ${plan.highlight
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            ABOUT — team
        ══════════════════════════════════════════════════════════════════ */}
        <section id="about" className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold
                bg-rose-50 text-rose-700 ring-1 ring-rose-100 mb-4">
                Our team
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">The people behind it</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                We&apos;re a small, focused team that cares deeply about developer experience
                and polished UI components.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
              {TEAM.map((member) => (
                <div key={member.name}
                  className="group text-center p-6 rounded-2xl ring-1 ring-gray-100 hover:ring-indigo-200
                    hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.from} ${member.to}
                    flex items-center justify-center mx-auto mb-4 shadow-sm
                    group-hover:scale-105 transition-transform duration-200`}>
                    <span className="text-lg font-bold text-white">{member.initials}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{member.role}</p>
                </div>
              ))}
            </div>

            {/* Mission statement */}
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50
              ring-1 ring-indigo-100 p-10 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our mission</h3>
              <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed text-lg">
                To ship beautiful, accessible, and performant UI components that developers
                can drop into any React project without compromise — from prototype to production.
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════════════════ */}
        <footer className="bg-slate-900 text-slate-400 py-10">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600
                flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-300 font-semibold">Acme Co.</span>
            </div>
            <p className="text-sm">Built with React 19, TypeScript &amp; Tailwind CSS · {new Date().getFullYear()}</p>
            <div className="flex gap-5 text-sm">
              {['Home', 'Features', 'Docs', 'Pricing'].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`}
                  className="hover:text-white transition-colors duration-150">
                  {l}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
