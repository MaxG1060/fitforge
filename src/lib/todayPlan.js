import { isoDate, dateFromDayTitle } from '@/lib/week'

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function extractDuration(body) {
  for (const raw of body.split('\n').slice(0, 5)) {
    const stripped = raw.replace(/[*_`]/g, '').trim()
    const m = stripped.match(/duration[:\s~]*([0-9]{1,3})/i)
    if (m) return parseInt(m[1], 10)
  }
  return null
}

export function findTodaySession(content, today = new Date()) {
  if (!content) return null
  const todayWeekday = WEEKDAYS[today.getDay()]
  const todayIso = isoDate(today)
  const sections = content.split(/^## /m).filter(Boolean)
  for (const sec of sections) {
    const [titleLine, ...rest] = sec.split('\n')
    const title = titleLine.trim()
    if (/weekly\s*focus/i.test(title)) continue
    const lower = title.toLowerCase()
    if (!lower.includes(todayWeekday)) continue
    const matchedIso = dateFromDayTitle(title, today)
    if (matchedIso && matchedIso !== todayIso) continue
    const body = rest.join('\n')
    return {
      title,
      duration: extractDuration(body),
    }
  }
  return null
}
