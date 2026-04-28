'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import {
  sendFriendRequest,
  respondToRequest,
  cancelOrRemoveFriend,
  searchProfiles,
} from '@/app/actions/friends'
import { toggleReaction } from '@/app/actions/reactions'

export default function SocialClient({
  myUsername,
  myIsPublic,
  incoming,
  outgoing,
  friends,
  leaderboard,
  feed = [],
  prefillUsername = '',
}) {
  const router = useRouter()
  const toast = useToast()
  const [pending, start] = useTransition()
  const [username, setUsername] = useState(prefillUsername)
  const [lbRange, setLbRange] = useState('week')

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (lbRange === 'streak') return b.streak - a.streak || b.weekCount - a.weekCount
    if (lbRange === 'month') return b.monthCount - a.monthCount || b.streak - a.streak
    if (lbRange === 'year') return b.allCount - a.allCount || b.streak - a.streak
    return b.weekCount - a.weekCount || b.streak - a.streak
  })
  const [suggestions, setSuggestions] = useState([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const searchSeq = useRef(0)
  const wrapRef = useRef(null)

  useEffect(() => {
    const term = username.trim().toLowerCase()
    if (term.length < 2) {
      setSuggestions([])
      return
    }
    const seq = ++searchSeq.current
    const t = setTimeout(async () => {
      const res = await searchProfiles({ q: term })
      if (seq !== searchSeq.current) return
      setSuggestions(res?.results ?? [])
      setActiveIdx(-1)
    }, 180)
    return () => clearTimeout(t)
  }, [username])

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSuggest(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function add(overrideUsername) {
    const u = (overrideUsername ?? username).trim().toLowerCase()
    if (!u) return
    start(async () => {
      const res = await sendFriendRequest({ username: u })
      if (res?.error) toast.error(res.error)
      else {
        toast.success(res.accepted ? 'Friend added.' : 'Request sent.')
        setUsername('')
        setSuggestions([])
        setShowSuggest(false)
        router.refresh()
      }
    })
  }

  function onKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) {
      if (e.key === 'Enter') add()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const choice = activeIdx >= 0 ? suggestions[activeIdx] : null
      add(choice?.username)
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
    }
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">Add friend</p>
          {!setupNeeded && myUsername && (
            <button
              onClick={async () => {
                const url = `${window.location.origin}/social?add=${myUsername}`
                try {
                  await navigator.clipboard.writeText(url)
                  toast.success('Invite link copied.')
                } catch {
                  toast.error('Could not copy.')
                }
              }}
              className="rounded-md border border-zinc-800 bg-transparent px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Copy invite link
            </button>
          )}
        </div>
        <div ref={wrapRef} className="relative">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">@</span>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase())
                setShowSuggest(true)
              }}
              onFocus={() => setShowSuggest(true)}
              onKeyDown={onKeyDown}
              placeholder="their-username"
              maxLength={20}
              autoComplete="off"
              className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={() => add()}
              disabled={pending || !username.trim()}
              className="shrink-0 rounded-md bg-orange-500 px-4 py-2 text-xs font-bold tracking-[0.15em] uppercase text-black hover:bg-orange-400 disabled:opacity-50 transition-colors"
            >
              {pending ? '…' : 'Add'}
            </button>
          </div>
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 z-10 max-h-72 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 shadow-lg">
              {suggestions.map((s, i) => (
                <li key={s.user_id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => add(s.username)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      i === activeIdx ? 'bg-zinc-900' : 'hover:bg-zinc-900'
                    }`}
                  >
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full border border-zinc-800 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-zinc-800 bg-black flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        {s.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{s.display_name}</p>
                      <p className="text-xs text-zinc-500 truncate">@{s.username}</p>
                    </div>
                    {s.relation && (
                      <span className="shrink-0 text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">
                        {s.relation === 'accepted' ? 'Friends' : 'Pending'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
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
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
            Leaderboard
          </p>
          <div className="flex gap-1 rounded-md border border-zinc-800 bg-black p-0.5">
            {LB_RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setLbRange(r.id)}
                className={`px-2.5 py-1 rounded-[5px] text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${
                  lbRange === r.id ? 'bg-orange-500 text-black' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {sortedLeaderboard.length === 0 ? (
          <p className="text-sm text-zinc-500">Add friends to see the leaderboard.</p>
        ) : (
          <ol className="space-y-2">
            {sortedLeaderboard.map((row, i) => (
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
                    {primaryValue(row, lbRange)}
                    <span className="ml-1 text-xs font-medium text-zinc-500">{primaryUnit(lbRange)}</span>
                  </p>
                  <p className="text-[10px] text-zinc-500 tabular-nums">{secondaryLabel(row, lbRange)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {feed.length > 0 && (
        <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-3">
            Activity · last 14 days
          </p>
          <ul className="divide-y divide-zinc-900">
            {feed.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}

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

const LB_RANGES = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'streak', label: 'Streak' },
]

function primaryValue(row, range) {
  if (range === 'streak') return row.streak
  if (range === 'month') return row.monthCount
  if (range === 'year') return row.allCount
  return row.weekCount
}
function primaryUnit(range) {
  if (range === 'streak') return 'days'
  return 'sess'
}
function secondaryLabel(row, range) {
  if (range === 'streak') return `${row.weekCount} this wk`
  if (range === 'month') return `${row.streak}d streak`
  if (range === 'year') return `${row.streak}d streak`
  return `${row.streak}d streak`
}

function shortSport(title) {
  if (!title) return 'Workout'
  // Strip leading weekday and separators: "Tuesday — Upper body" -> "Upper body"
  const stripped = title.replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[—:\-]\s*/i, '').trim()
  return stripped || title
}

function relativeDate(iso) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(iso)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today - target) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const REACTION_EMOJIS = ['🔥', '💪', '👏']

function FeedItem({ item }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, start] = useTransition()
  const [counts, setCounts] = useState(item.counts)
  const [mine, setMine] = useState(new Set(item.mine))

  function react(emoji) {
    start(async () => {
      const had = mine.has(emoji)
      // Optimistic
      const nextCounts = { ...counts, [emoji]: (counts[emoji] || 0) + (had ? -1 : 1) }
      if (nextCounts[emoji] <= 0) delete nextCounts[emoji]
      const nextMine = new Set(mine)
      if (had) nextMine.delete(emoji)
      else nextMine.add(emoji)
      setCounts(nextCounts)
      setMine(nextMine)

      const res = await toggleReaction({
        completionUserId: item.completionUserId,
        completionDate: item.date,
        emoji,
      })
      if (res?.error) {
        toast.error(res.error)
        setCounts(item.counts)
        setMine(new Set(item.mine))
      } else {
        router.refresh()
      }
    })
  }

  const header = (
    <div className="flex items-center gap-3">
      {item.person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.person.avatar_url}
          alt=""
          className="h-9 w-9 rounded-full border border-zinc-800 object-cover shrink-0"
        />
      ) : (
        <div className="h-9 w-9 rounded-full border border-zinc-800 bg-black flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
          {item.person.display_name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white truncate">
          <span className="font-bold">{item.person.display_name}</span>
          <span className="text-zinc-400"> completed </span>
          <span className="font-medium">{shortSport(item.day_title)}</span>
        </p>
        <p className="text-xs text-zinc-500 truncate">{relativeDate(item.date)}</p>
      </div>
    </div>
  )

  return (
    <li className="py-3 first:pt-0">
      {item.person.username && !item.person.isMe ? (
        <Link
          href={`/u/${item.person.username}`}
          className="block hover:bg-zinc-900/50 -mx-2 px-2 rounded-md transition-colors"
        >
          {header}
        </Link>
      ) : (
        header
      )}
      <div className="mt-2 flex flex-wrap gap-1.5 pl-12">
        {REACTION_EMOJIS.map((emoji) => {
          const count = counts[emoji] || 0
          const reacted = mine.has(emoji)
          return (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              disabled={pending}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                reacted
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
                  : 'border-zinc-800 bg-black text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              } disabled:opacity-50`}
            >
              <span>{emoji}</span>
              {count > 0 && <span className="tabular-nums">{count}</span>}
            </button>
          )
        })}
      </div>
    </li>
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
