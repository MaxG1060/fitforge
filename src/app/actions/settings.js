'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return { supabase, user }
}

export async function disconnectStrava() {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('strava_tokens').delete().eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function disconnectWhoop() {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('whoop_tokens').delete().eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function disconnectOura() {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('oura_tokens').delete().eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function resetOnboarding() {
  const { supabase } = await getUser()
  await supabase.auth.updateUser({ data: { onboarded_at: null } })
  redirect('/onboarding')
}

export async function deleteAccount() {
  const { user } = await getUser()
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return { error: error.message }
  redirect('/login')
}
