'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [magicSent, setMagicSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
      else setInfo('Check your email to confirm your account.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else window.location.href = '/dashboard'
    }

    setLoading(false)
  }

  async function sendMagicLink() {
    if (!email) {
      setError('Enter your email first.')
      return
    }
    setError(null)
    setInfo(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) setError(error.message)
    else setMagicSent(true)

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-[0.2em] uppercase text-orange-500">FitForge</h1>
          <p className="mt-3 text-sm text-zinc-500">Your personal fitness companion</p>
        </div>

        {magicSent ? (
          <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400 mb-3">
              Check your inbox
            </p>
            <p className="text-sm text-zinc-300">
              We sent a sign-in link to <span className="font-semibold text-white">{email}</span>.
            </p>
            <button
              onClick={() => { setMagicSent(false); setInfo(null); setError(null) }}
              className="mt-5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400 hover:text-white"
            >
              Back
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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

              <div>
                <label className="block text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              {info && (
                <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-md px-3 py-2">
                  {info}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-orange-500 px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
              >
                {loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>

              <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.15em] uppercase">
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null) }}
                  className="text-zinc-400 hover:text-white"
                >
                  {mode === 'signin' ? 'Create account' : 'Have an account? Sign in'}
                </button>
                <button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={loading}
                  className="text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  Email me a magic link
                </button>
              </div>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-900" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-600">Or</span>
              <div className="flex-1 h-px bg-zinc-900" />
            </div>

            <a
              href="/api/strava/login"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#fc4c02] px-4 py-2.5 text-xs font-bold tracking-[0.15em] uppercase text-white hover:bg-[#e54402] transition-colors"
            >
              Sign in with Strava
            </a>
          </>
        )}
      </div>
    </div>
  )
}
