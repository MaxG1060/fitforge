import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { content } = await request.json()
  if (!content) return Response.json({ error: 'Missing content' }, { status: 400 })

  const { data: latest } = await supabase
    .from('plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('kind', 'training')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest) {
    const { error } = await supabase.from('plans').update({ content }).eq('id', latest.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('plans').insert({ user_id: user.id, kind: 'training', content })
    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
