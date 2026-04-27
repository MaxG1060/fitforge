'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const USERNAME_RE = /^[a-z0-9-]{3,20}$/

export async function claimUsername({ username, displayName }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const u = (username ?? '').trim().toLowerCase()
  if (!USERNAME_RE.test(u)) {
    return { error: 'Username must be 3–20 chars, lowercase letters, digits, or hyphens.' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      username: u,
      display_name: displayName?.trim() || null,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    if (error.code === '23505') return { error: 'That username is already taken.' }
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath(`/u/${u}`)
  return { ok: true, username: u }
}

export async function setProfileVisibility({ isPublic }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in' }

  const { data: existing } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!existing) return { error: 'Claim a username first.' }

  const { error } = await supabase
    .from('profiles')
    .update({ is_public: !!isPublic, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath(`/u/${existing.username}`)
  return { ok: true }
}
