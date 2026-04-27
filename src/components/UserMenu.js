'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default function UserMenu({ email, profileUrl }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-colors p-1 pr-3"
      >
        {profileUrl ? (
          <img
            src={profileUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
            {(email?.[0] ?? '?').toUpperCase()}
          </div>
        )}
        <span className="hidden sm:inline text-xs text-zinc-400 max-w-[160px] truncate">
          {email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/40 z-30 overflow-hidden">
          <div className="px-3 py-3 border-b border-zinc-900">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Signed in as</p>
            <p className="mt-1 text-sm text-white truncate">{email}</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block w-full text-left px-3 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors border-t border-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
