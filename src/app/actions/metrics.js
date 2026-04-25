'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveBodyMetrics(formData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const weight_kg = parseFloat(formData.get('weight_kg'))
  const body_fat_pct = parseFloat(formData.get('body_fat_pct'))
  const muscle_mass_kg = parseFloat(formData.get('muscle_mass_kg'))

  const row = {
    user_id: user.id,
    weight_kg: isNaN(weight_kg) ? null : weight_kg,
    body_fat_pct: isNaN(body_fat_pct) ? null : body_fat_pct,
    muscle_mass_kg: isNaN(muscle_mass_kg) ? null : muscle_mass_kg,
  }

  if (row.weight_kg == null && row.body_fat_pct == null && row.muscle_mass_kg == null) {
    throw new Error('Enter at least one metric')
  }

  const { error } = await supabase.from('body_metrics').insert(row)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
}
