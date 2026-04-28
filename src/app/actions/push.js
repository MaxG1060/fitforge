'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function subscribePush({ endpoint, p256dh, auth, userAgent }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  if (!endpoint || !p256dh || !auth) return { error: 'Invalid subscription' }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth, user_agent: userAgent ?? null },
      { onConflict: 'user_id,endpoint' }
    )

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

export async function unsubscribePush({ endpoint }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }
  if (!endpoint) return { error: 'Missing endpoint' }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}
