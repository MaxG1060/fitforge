'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/training', label: 'Training' },
  { href: '/meals', label: 'Meals' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-zinc-900 bg-black sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
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
  )
}
