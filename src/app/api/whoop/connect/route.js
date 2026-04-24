import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildAuthorizeUrl } from '@/lib/whoop'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  redirect(buildAuthorizeUrl(user.id))
}
