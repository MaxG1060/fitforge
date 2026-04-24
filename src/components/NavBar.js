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
    <nav className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/')
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
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
