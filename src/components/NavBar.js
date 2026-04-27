'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <>
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
      </>
    ),
  },
  {
    href: '/training',
    label: 'Training',
    icon: (
      <>
        <path d="M3 9v6M6 6v12M10 8v8M14 8v8M18 6v12M21 9v6" />
        <path d="M6 12h12" />
      </>
    ),
  },
  {
    href: '/meals',
    label: 'Meals',
    icon: (
      <>
        <path d="M5 3v8a2 2 0 002 2h0v8M9 3v6a2 2 0 01-2 2" />
        <path d="M15 3c-1.5 2-2 4-2 6v3h2v9" />
      </>
    ),
  },
]

function Icon({ children, className = '' }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export default function NavBar() {
  const pathname = usePathname()

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <nav className="hidden sm:block border-b border-zinc-900 bg-black sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto">
          {TABS.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-3 text-xs font-bold tracking-[0.15em] uppercase border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <nav
        className="sm:hidden fixed left-0 right-0 bottom-0 z-20 border-t border-zinc-900 bg-black/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-3">
          {TABS.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${
                  active ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon>{tab.icon}</Icon>
                {tab.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
