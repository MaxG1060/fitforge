import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeStreak, isoDate, weekStartMonday } from '@/lib/week'
import SocialClient from './SocialClient'

export default async function SocialPage() {
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
  const sixtyDaysAgo = isoDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
  const mondayIso = isoDate(weekStartMonday())

  const { data: completions } = allLeaderboardIds.length
    ? await supabase
        .from('workout_completions')
        .select('user_id, date')
        .in('user_id', allLeaderboardIds)
        .gte('date', sixtyDaysAgo)
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
    const streak = computeStreak(dates)
    const person = uid === user.id ? me : buildPerson(uid)
    return { ...person, weekCount, streak }
  })
  leaderboardRows.sort((a, b) => b.weekCount - a.weekCount || b.streak - a.streak)

  const friendsList = accepted.map((r) => {
    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id
    return { id: r.id, person: buildPerson(otherId) }
  })

  return (
    <SocialClient
      myUsername={myProfile?.username ?? null}
      myIsPublic={!!myProfile?.is_public}
      incoming={incomingDetailed}
      outgoing={outgoingDetailed}
      friends={friendsList}
      leaderboard={leaderboardRows}
    />
  )
}
