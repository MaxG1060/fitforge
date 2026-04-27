'use client'

import { useState, useTransition } from 'react'
import { useToast } from './ToastProvider'
import { claimUsername, setProfileVisibility } from '@/app/actions/profile'

export default function PublicProfileCard({ initialUsername, initialDisplayName, initialIsPublic, appUrl }) {
  const toast = useToast()
  const [pending, start] = useTransition()
  const [username, setUsername] = useState(initialUsername ?? '')
  const [displayName, setDisplayName] = useState(initialDisplayName ?? '')
  const [isPublic, setIsPublic] = useState(!!initialIsPublic)
  const [savedUsername, setSavedUsername] = useState(initialUsername ?? null)

  const shareUrl = savedUsername ? `${appUrl}/u/${savedUsername}` : null

  function save() {
    start(async () => {
      const res = await claimUsername({ username, displayName })
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Profile saved.')
        setSavedUsername(res.username)
      }
    })
  }

  function togglePublic(next) {
    setIsPublic(next)
    start(async () => {
      const res = await setProfileVisibility({ isPublic: next })
      if (res?.error) {
        setIsPublic(!next)
        toast.error(res.error)
      } else {
        toast.success(next ? 'Profile is now public.' : 'Profile set to private.')
      }
    })
  }

  async function copyLink() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied.')
    } catch {
      toast.error('Could not copy.')
    }
  }

  return (
    <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 space-y-4">
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Public profile</p>

      <div className="space-y-2">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Username</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">/u/</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="your-name"
            maxLength={20}
            className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
          />
        </div>
        <p className="text-xs text-zinc-500">3–20 chars: lowercase letters, digits, hyphens.</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Display name (optional)</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Max"
          maxLength={40}
          className="w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
        />
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
      >
        {pending ? 'Saving…' : savedUsername ? 'Update' : 'Claim username'}
      </button>

      {savedUsername && (
        <div className="border-t border-zinc-900 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-white">Visibility</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {isPublic ? 'Anyone with the link can view your profile.' : 'Only you can see your profile.'}
              </p>
            </div>
            <button
              onClick={() => togglePublic(!isPublic)}
              disabled={pending}
              role="switch"
              aria-checked={isPublic}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                isPublic ? 'bg-emerald-500' : 'bg-zinc-800'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {isPublic && shareUrl && (
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-300">
                {shareUrl}
              </code>
              <button
                onClick={copyLink}
                className="shrink-0 rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
