'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) setError(error.message)
    else setSent(true)

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-orange-500">FitForge</h1>
          <p className="mt-3 text-sm text-zinc-500">Your personal fitness companion</p>
        </div>

        {sent ? (
          <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400 mb-3">
              Check your inbox
            </p>
            <p className="text-sm text-zinc-300">
              We sent a sign-in link to <span className="font-semibold text-white">{email}</span>.
            </p>
            <p className="mt-3 text-xs text-zinc-500">Click the link to sign in. You can close this tab.</p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Sending…' : 'Email me a sign-in link'}
            </button>

            <p className="text-center text-xs text-zinc-500 pt-2">
              No password needed. We&apos;ll email you a magic link.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
