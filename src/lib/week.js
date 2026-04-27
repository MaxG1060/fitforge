const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

export function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10)
}

export function todayISO() {
  return isoDate(new Date())
}

export function weekStartMonday(today = new Date()) {
  const d = new Date(today)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function dateForWeekday(weekdayName, today = new Date()) {
  const idx = WEEKDAYS.indexOf(weekdayName.toLowerCase())
  if (idx < 0) return null
  const monday = weekStartMonday(today)
  const offset = (idx + 6) % 7
  const result = new Date(monday)
  result.setDate(monday.getDate() + offset)
  return isoDate(result)
}

export function dateFromDayTitle(title, today = new Date()) {
  if (!title) return null
  const lower = title.toLowerCase()
  for (const wd of WEEKDAYS) {
    if (lower.includes(wd)) return dateForWeekday(wd, today)
  }
  return null
}

export function computeStreak(completionDates, today = new Date()) {
  const set = new Set(completionDates)
  let streak = 0
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  while (set.has(isoDate(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function weekRangeISO(today = new Date()) {
  const monday = weekStartMonday(today)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: isoDate(monday), end: isoDate(sunday) }
}
