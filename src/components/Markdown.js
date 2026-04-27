function renderInline(text, keyPrefix) {
  const parts = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  let last = 0
  let i = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[1]) parts.push(<strong key={`${keyPrefix}-${i++}`} className="font-bold text-white">{match[1]}</strong>)
    else if (match[2]) parts.push(<em key={`${keyPrefix}-${i++}`} className="italic text-zinc-300">{match[2]}</em>)
    else if (match[3]) parts.push(<code key={`${keyPrefix}-${i++}`} className="rounded bg-black/60 border border-zinc-800 px-1 py-0.5 text-[11px] text-zinc-200">{match[3]}</code>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function Markdown({ content, accent = '#f97316' }) {
  if (!content) return null
  const lines = content.split('\n')
  const blocks = []
  let key = 0
  let bullets = null
  let currentSection = null
  let sectionKey = 0

  function flushBullets() {
    if (bullets && bullets.length) {
      const list = (
        <ul key={`ul-${key++}`} className="space-y-1.5 mt-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-zinc-300 leading-relaxed">
              <span className="mt-2 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: accent }} />
              <span className="min-w-0">{renderInline(b, `b-${key}-${i}`)}</span>
            </li>
          ))}
        </ul>
      )
      pushBlock(list)
    }
    bullets = null
  }

  function pushBlock(node) {
    if (currentSection) currentSection.children.push(node)
    else blocks.push(node)
  }

  function flushSection() {
    flushBullets()
    if (currentSection) {
      blocks.push(
        <section key={`s-${sectionKey++}`} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: accent }}>
            {currentSection.title}
          </h3>
          <div className="space-y-2">{currentSection.children}</div>
        </section>
      )
      currentSection = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('## ')) {
      flushSection()
      currentSection = { title: line.slice(3).trim(), children: [] }
      continue
    }

    if (line.startsWith('### ')) {
      flushBullets()
      pushBlock(
        <h4 key={`h4-${key++}`} className="text-sm font-bold text-zinc-100 mt-3 mb-1 tracking-tight">
          {renderInline(line.slice(4).trim(), `h4-${key}`)}
        </h4>
      )
      continue
    }

    if (/^-{3,}\s*$/.test(line) || /^\*{3,}\s*$/.test(line) || /^_{3,}\s*$/.test(line)) {
      flushBullets()
      continue
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!bullets) bullets = []
      bullets.push(line.slice(2).trim())
      continue
    }

    flushBullets()

    if (line.trim() === '') continue

    pushBlock(
      <p key={`p-${key++}`} className="text-sm text-zinc-400 leading-relaxed">
        {renderInline(line, `p-${key}`)}
      </p>
    )
  }

  flushSection()

  return <div className="space-y-3">{blocks}</div>
}
