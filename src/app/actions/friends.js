'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    revalidatePath('/social')
    return { ok: true, accepted: true }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: target.user_id })
  if (error) return { error: error.message }

  revalidatePath('/social')
  return { ok: true }
}

export async function respondToRequest({ id, accept }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  if (accept) {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', id)
      .eq('addressee_id', user.id)
    if (error) return { error: error.message }
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
