'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'
import { revalidatePath } from 'next/cache'

const ALLOWED = new Set(['🔥', '💪', '👏'])

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

export async function toggleReaction({ completionUserId, completionDate, emoji }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  if (!completionUserId || !completionDate || !ALLOWED.has(emoji)) {
    return { error: 'Invalid reaction' }
  }

  // Toggle: if exists -> delete, else insert
  const { data: existing } = await supabase
    .from('completion_reactions')
    .select('id')
    .eq('completion_user_id', completionUserId)
    .eq('completion_date', completionDate)
    .eq('reactor_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('completion_reactions')
      .delete()
      .eq('id', existing.id)
    if (error) return { error: error.message }
    revalidatePath('/social')
    return { ok: true, reacted: false }
  }

  const { error } = await supabase
    .from('completion_reactions')
    .insert({
      completion_user_id: completionUserId,
      completion_date: completionDate,
      reactor_id: user.id,
      emoji,
    })
  if (error) return { error: error.message }

  // Notify the completion owner unless reacting on own completion
  if (completionUserId !== user.id) {
    const myName = await getDisplayName(user.id)
    sendPushToUser(completionUserId, {
      title: `${emoji} from ${myName}`,
      body: `${myName} reacted to your workout.`,
      url: '/social',
      tag: `reaction-${completionDate}`,
    }).catch(() => {})
  }

  revalidatePath('/social')
  return { ok: true, reacted: true }
}
