import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeStreak, isoDate, weekStartMonday } from '@/lib/week'
import SocialClient from './SocialClient'

export default async function SocialPage({ searchParams }) {
  const sp = (await searchParams) ?? {}
  const prefillUsername = typeof sp.add === 'string' ? sp.add.toLowerCase().slice(0, 20) : ''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // My profile (need username + is_public for messaging)
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('username, is_public')
    .eq('user_id', user.id)
    .maybeSingle()

  // All friendships involving me
  const { data: rels } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id, created_at')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  const incoming = (rels ?? []).filter(
    (r) => r.status === 'pending' && r.addressee_id === user.id
  )
  const outgoing = (rels ?? []).filter(
    (r) => r.status === 'pending' && r.requester_id === user.id
  )
  const accepted = (rels ?? []).filter((r) => r.status === 'accepted')

  // Resolve "other" user IDs
  const otherIds = new Set()
  for (const r of rels ?? []) {
    otherIds.add(r.requester_id === user.id ? r.addressee_id : r.requester_id)
  }
  const otherIdList = [...otherIds]

  // Profiles + Strava avatars
  const admin = createAdminClient()
  const [{ data: profiles }, { data: stravas }] = await Promise.all([
    otherIdList.length
      ? admin
          .from('profiles')
          .select('user_id, username, display_name')
          .in('user_id', otherIdList)
      : Promise.resolve({ data: [] }),
    otherIdList.length
      ? admin
          .from('strava_tokens')
          .select('user_id, profile_url, firstname')
          .in('user_id', otherIdList)
      : Promise.resolve({ data: [] }),
  ])

  const profileById = new Map((profiles ?? []).map((p) => [p.user_id, p]))
  const stravaById = new Map((stravas ?? []).map((s) => [s.user_id, s]))

  // Build user-shaped objects keyed by user_id
  function buildPerson(uid) {
    const p = profileById.get(uid)
    const s = stravaById.get(uid)
    return {
      user_id: uid,
      username: p?.username ?? null,
      display_name: p?.display_name?.trim() || s?.firstname || p?.username || 'Athlete',
      avatar_url: s?.profile_url ?? null,
    }
  }

  const incomingDetailed = incoming.map((r) => ({
    id: r.id,
    person: buildPerson(r.requester_id),
  }))
  const outgoingDetailed = outgoing.map((r) => ({
    id: r.id,
    person: buildPerson(r.addressee_id),
  }))

  // Friends list with weekly stats for leaderboard
  const friendIds = accepted.map((r) =>
    r.requester_id === user.id ? r.addressee_id : r.requester_id
  )
  const allLeaderboardIds = [...new Set([user.id, ...friendIds])]
  const yearAgoIso = isoDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
  const mondayIso = isoDate(weekStartMonday())
  const monthAgoIso = isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

  const { data: completions } = allLeaderboardIds.length
    ? await supabase
        .from('workout_completions')
        .select('user_id, date, day_title')
        .in('user_id', allLeaderboardIds)
        .gte('date', yearAgoIso)
        .order('date', { ascending: false })
    : { data: [] }

  const datesByUser = new Map()
  for (const c of completions ?? []) {
    if (!datesByUser.has(c.user_id)) datesByUser.set(c.user_id, [])
    datesByUser.get(c.user_id).push(c.date)
  }

  const myStravaResp = await supabase
    .from('strava_tokens')
    .select('profile_url, firstname')
    .eq('user_id', user.id)
    .maybeSingle()
  const me = {
    user_id: user.id,
    username: myProfile?.username ?? null,
    display_name:
      myProfile?.username ||
      myStravaResp.data?.firstname ||
      user.email,
    avatar_url: myStravaResp.data?.profile_url ?? null,
    isMe: true,
  }

  const leaderboardRows = allLeaderboardIds.map((uid) => {
    const dates = datesByUser.get(uid) ?? []
    const weekCount = dates.filter((d) => d >= mondayIso).length
    const monthCount = dates.filter((d) => d >= monthAgoIso).length
    const allCount = dates.length
    const streak = computeStreak(dates)
    const person = uid === user.id ? me : buildPerson(uid)
    return { ...person, weekCount, monthCount, allCount, streak }
  })

  const friendsList = accepted.map((r) => {
    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id
    return { id: r.id, person: buildPerson(otherId) }
  })

  // Activity feed — friends + me, last 14 days, newest first
  const fourteenDaysAgo = isoDate(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
  const feedRaw = (completions ?? [])
    .filter((c) => c.date >= fourteenDaysAgo)
    .slice(0, 50)

  // Reactions on these completions
  const feedUserIds = [...new Set(feedRaw.map((c) => c.user_id))]
  const feedDates = [...new Set(feedRaw.map((c) => c.date))]
  const { data: reactions } = feedRaw.length
    ? await supabase
        .from('completion_reactions')
        .select('completion_user_id, completion_date, reactor_id, emoji')
        .in('completion_user_id', feedUserIds)
        .in('completion_date', feedDates)
    : { data: [] }

  const reactionsByKey = new Map()
  for (const r of reactions ?? []) {
    const key = `${r.completion_user_id}|${r.completion_date}`
    if (!reactionsByKey.has(key)) reactionsByKey.set(key, [])
    reactionsByKey.get(key).push(r)
  }

  const feed = feedRaw.map((c) => {
    const person = c.user_id === user.id ? me : buildPerson(c.user_id)
    const rs = reactionsByKey.get(`${c.user_id}|${c.date}`) ?? []
    const counts = {}
    const mine = new Set()
    for (const r of rs) {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
      if (r.reactor_id === user.id) mine.add(r.emoji)
    }
    return {
      id: `${c.user_id}-${c.date}`,
      date: c.date,
      day_title: c.day_title,
      person,
      completionUserId: c.user_id,
      counts,
      mine: [...mine],
    }
  })

  return (
    <SocialClient
      myUsername={myProfile?.username ?? null}
      myIsPublic={!!myProfile?.is_public}
      incoming={incomingDetailed}
      outgoing={outgoingDetailed}
      friends={friendsList}
      leaderboard={leaderboardRows}
      feed={feed}
      prefillUsername={prefillUsername}
    />
  )
}
