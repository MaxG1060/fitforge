'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markDayDone({ date, dayTitle }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!date) return { error: 'Missing date' }

  const { error } = await supabase
    .from('workout_completions')
    .upsert(
      { user_id: user.id, date, day_title: dayTitle ?? null },
      { onConflict: 'user_id,date' }
    )

  if (error) return { error: error.message }
  revalidatePath('/training')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function unmarkDay({ date }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!date) return { error: 'Missing date' }

  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date)

  if (error) return { error: error.message }
  revalidatePath('/training')
  revalidatePath('/dashboard')
  return { ok: true }
}
