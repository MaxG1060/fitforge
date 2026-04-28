'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'
import { revalidatePath } from 'next/cache'

async function getDisplayName(userId) {
  const admin = createAdminClient()
  const [{ data: profile }, { data: strava }] = await Promise.all([
    admin.from('profiles').select('username, display_name').eq('user_id', userId).maybeSingle(),
    admin.from('strava_tokens').select('firstname').eq('user_id', userId).maybeSingle(),
  ])
  return (
    profile?.display_name?.trim() ||
    strava?.firstname ||
    profile?.username ||
    'Someone'
  )
}

export async function searchProfiles({ q }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const term = (q ?? '').trim().toLowerCase()
  if (term.length < 2) return { results: [] }

  const { data: matches } = await supabase
    .from('profiles')
    .select('user_id, username, display_name')
    .eq('is_public', true)
    .ilike('username', `${term}%`)
    .neq('user_id', user.id)
    .order('username', { ascending: true })
    .limit(8)

  if (!matches || matches.length === 0) return { results: [] }

  // Already-friend or pending status to filter / annotate
  const ids = matches.map((m) => m.user_id)
  const { data: rels } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.in.(${ids.join(',')})),and(addressee_id.eq.${user.id},requester_id.in.(${ids.join(',')}))`
    )
  const relByOther = new Map()
  for (const r of rels ?? []) {
    const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id
    relByOther.set(otherId, r.status)
  }

  const admin = createAdminClient()
  const { data: stravas } = await admin
    .from('strava_tokens')
    .select('user_id, profile_url, firstname')
    .in('user_id', ids)
  const stravaById = new Map((stravas ?? []).map((s) => [s.user_id, s]))

  const results = matches.map((m) => {
    const s = stravaById.get(m.user_id)
    return {
      user_id: m.user_id,
      username: m.username,
      display_name: m.display_name?.trim() || s?.firstname || m.username,
      avatar_url: s?.profile_url ?? null,
      relation: relByOther.get(m.user_id) ?? null,
    }
  })

  return { results }
}

export async function sendFriendRequest({ username }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const u = (username ?? '').trim().toLowerCase()
  if (!u) return { error: 'Enter a username.' }

  const { data: target } = await supabase
    .from('profiles')
    .select('user_id, username')
    .eq('username', u)
    .eq('is_public', true)
    .maybeSingle()
  if (!target) return { error: 'No public user with that username.' }
  if (target.user_id === user.id) return { error: "You can't add yourself." }

  // Check existing relationship in either direction
  const { data: existing } = await supabase
    .from('friendships')
    .select('id, status, requester_id, addressee_id')
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) {
    if (existing.status === 'accepted') return { error: 'Already friends.' }
    if (existing.requester_id === user.id) return { error: 'Request already sent.' }
    // They sent a pending request to us — auto-accept
    const { error: acceptErr } = await supabase
      .from('friendships')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (acceptErr) return { error: acceptErr.message }
    const myName = await getDisplayName(user.id)
    sendPushToUser(existing.requester_id, {
      title: 'New friend',
      body: `${myName} accepted your friend request.`,
      url: '/social',
      tag: 'friend-accepted',
    }).catch(() => {})
    revalidatePath('/social')
    return { ok: true, accepted: true }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: target.user_id })
  if (error) return { error: error.message }

  const myName = await getDisplayName(user.id)
  sendPushToUser(target.user_id, {
    title: 'New friend request',
    body: `${myName} wants to be your friend on FitForge.`,
    url: '/social',
    tag: 'friend-request',
  }).catch(() => {})

  revalidatePath('/social')
  return { ok: true }
}

export async function respondToRequest({ id, accept }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  if (accept) {
    const { data: row } = await supabase
      .from('friendships')
      .select('id, requester_id, addressee_id')
      .eq('id', id)
      .eq('addressee_id', user.id)
      .maybeSingle()
    if (!row) return { error: 'Request not found.' }
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', id)
      .eq('addressee_id', user.id)
    if (error) return { error: error.message }
    const myName = await getDisplayName(user.id)
    sendPushToUser(row.requester_id, {
      title: 'New friend',
      body: `${myName} accepted your friend request.`,
      url: '/social',
      tag: 'friend-accepted',
    }).catch(() => {})
  } else {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', id)
      .eq('addressee_id', user.id)
    if (error) return { error: error.message }
  }

  revalidatePath('/social')
  return { ok: true }
}

export async function cancelOrRemoveFriend({ id }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/social')
  return { ok: true }
}
