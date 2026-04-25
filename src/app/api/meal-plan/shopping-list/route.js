import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(request) {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 })

  const { content } = await request.json()
  if (!content) return Response.json({ error: 'Missing content' }, { status: 400 })

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: `You produce consolidated grocery shopping lists from meal prep plans. Group items by section (Proteins, Produce, Pantry, Dairy & Eggs, Other). Combine duplicate ingredients across meals into single line items with summed quantities. Use clean markdown with ## headings per section and - bullets per item. No preamble, no closing remarks — only the list.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a consolidated shopping list for this meal plan:\n\n${content}`,
      },
    ],
  })

  const list = response.content[0].text.trim()
  return Response.json({ list })
}
