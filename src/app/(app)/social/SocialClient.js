'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import {
  sendFriendRequest,
  respondToRequest,
  cancelOrRemoveFriend,
} from '@/app/actions/friends'

export default function SocialClient({
  myUsername,
  myIsPublic,
  incoming,
  outgoing,
  friends,
  leaderboard,
}) {
  const router = useRouter()
  const toast = useToast()
  const [pending, start] = useTransition()
  const [username, setUsername] = useState('')

  function add() {
    const u = username.trim().toLowerCase()
    if (!u) return
    start(async () => {
      const res = await sendFriendRequest({ username: u })
      if (res?.error) toast.error(res.error)
      else {
        toast.success(res.accepted ? 'Friend added.' : 'Request sent.')
        setUsername('')
        router.refresh()
      }
    })
  }

  function respond(id, accept) {
    start(async () => {
      const res = await respondToRequest({ id, accept })
      if (res?.error) toast.error(res.error)
      else {
        toast.success(accept ? 'Friend added.' : 'Request declined.')
        router.refresh()
      }
    })
  }

  function remove(id, label) {
    start(async () => {
      const res = await cancelOrRemoveFriend({ id })
      if (res?.error) toast.error(res.error)
      else {
        toast.success(`${label} removed.`)
        router.refresh()
      }
    })
  }

  const setupNeeded = !myUsername || !myIsPublic

  return (
    <>
      <div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Friends</p>
        <h2 className="mt-1 text-3xl font-black tracking-tight">Social</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Add friends by username, see who&apos;s training this week.
        </p>
      </div>

      {setupNeeded && (
        <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm">
          <p className="text-amber-200">
            {!myUsername
              ? 'Claim a username and make your profile public so friends can find you.'
              : 'Make your profile public so friends can find you.'}
          </p>
          <Link
            href="/settings"
            className="mt-2 inline-block rounded-md bg-amber-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-amber-400 transition-colors"
          >
            Open settings
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6 space-y-3">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Add friend</p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="their-username"
            maxLength={20}
            className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
          />
          <button
            onClick={add}
            disabled={pending || !username.trim()}
            className="shrink-0 rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : 'Add'}
          </button>
        </div>
      </div>

      {incoming.length > 0 && (
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
            Requests · {incoming.length}
          </p>
          <ul className="divide-y divide-zinc-900">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <PersonRow person={r.person} />
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => respond(r.id, true)}
                    disabled={pending}
                    className="rounded-md bg-emerald-500 px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-black hover:bg-emerald-400 disabled:opacity-50 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(r.id, false)}
                    disabled={pending}
                    className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
            Sent · {outgoing.length}
          </p>
          <ul className="divide-y divide-zinc-900">
            {outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <PersonRow person={r.person} />
                <button
                  onClick={() => remove(r.id, '@' + r.person.username)}
                  disabled={pending}
                  className="shrink-0 rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
          Leaderboard · this week
        </p>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-zinc-500">Add friends to see the leaderboard.</p>
        ) : (
          <ol className="space-y-2">
            {leaderboard.map((row, i) => (
              <li
                key={row.user_id}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                  row.isMe
                    ? 'border-orange-500/40 bg-orange-500/5'
                    : 'border-zinc-900 bg-black/40'
                }`}
              >
                <span className="text-base font-black w-6 text-zinc-400 tabular-nums">
                  {i + 1}
                </span>
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full border border-zinc-800 object-cover shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                    {row.display_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {row.display_name}
                    {row.isMe && <span className="ml-2 text-[10px] text-orange-400">YOU</span>}
                  </p>
                  {row.username && (
                    <p className="text-xs text-zinc-500 truncate">@{row.username}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black tabular-nums">
                    {row.weekCount}
                    <span className="ml-1 text-xs font-medium text-zinc-500">sess</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 tabular-nums">{row.streak}d streak</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {friends.length > 0 && (
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
            Friends · {friends.length}
          </p>
          <ul className="divide-y divide-zinc-900">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <PersonRow person={f.person} link />
                <button
                  onClick={() => remove(f.id, '@' + f.person.username)}
                  disabled={pending}
                  className="shrink-0 rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function PersonRow({ person, link }) {
  const inner = (
    <div className="flex items-center gap-3 min-w-0">
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.avatar_url}
          alt=""
          className="h-9 w-9 rounded-full border border-zinc-800 object-cover shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
          {person.display_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate">{person.display_name}</p>
        {person.username && (
          <p className="text-xs text-zinc-500 truncate">@{person.username}</p>
        )}
      </div>
    </div>
  )
  if (link && person.username) {
    return (
      <Link href={`/u/${person.username}`} className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    )
  }
  return <div className="min-w-0 flex-1">{inner}</div>
}
