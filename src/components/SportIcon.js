const PATHS = {
  gym: <><path d="M3 9v6M6 6v12M10 8v8M14 8v8M18 6v12M21 9v6" /><path d="M6 12h12" /></>,
  running: <path d="M3 17l4-4 3 3 4-4 3 3 4-4" />,
  cycling: <><circle cx="6" cy="16" r="3" /><circle cx="18" cy="16" r="3" /><path d="M6 16l4-7h4l4 7M10 9l3-3" /></>,
  yoga: <><circle cx="12" cy="6" r="2" /><path d="M5 19c2-3 4-5 7-5s5 2 7 5M9 14l-2 5M15 14l2 5" /></>,
  pilates: <path d="M4 12c4-6 12-6 16 0M4 12c4 6 12 6 16 0" />,
  padel: <><circle cx="9" cy="9" r="5" /><path d="M13 13l6 6M16 6l1.5-1.5" /></>,
  boxing: <path d="M7 8h7a3 3 0 013 3v3a4 4 0 01-4 4H9a2 2 0 01-2-2V8zM10 8V6a2 2 0 012-2h1a2 2 0 012 2v2" />,
  swimming: <><path d="M3 10c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /><path d="M3 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /></>,
  hiit: <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />,
  hiking: <><path d="M3 20l5-9 4 6 3-4 6 7H3z" /><circle cx="16" cy="5" r="1.5" /></>,
  rowing: <><path d="M3 19l18-14M9 17l5-5" /><circle cx="6" cy="20" r="1.5" /></>,
  rest: <path d="M21 12.5A8.5 8.5 0 1111.5 3a6.5 6.5 0 009.5 9.5z" />,
  fire: <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-3 2-3 2-6s2-3 3-4z" />,
}

const KEYWORDS = [
  { keys: ['rest', 'off day', 'recovery day', 'active recovery'], type: 'rest' },
  { keys: ['mobility', 'stretch', 'foam roll'], type: 'yoga' },
  { keys: ['gym', 'strength', 'lift', 'weight', 'push', 'pull', 'squat', 'deadlift', 'bench'], type: 'gym' },
  { keys: ['hiit', 'interval', 'metcon', 'circuit'], type: 'hiit' },
  { keys: ['run', 'jog', 'tempo', '5k', '10k', 'sprint'], type: 'running' },
  { keys: ['cycling', 'cycle', 'bike', 'ride'], type: 'cycling' },
  { keys: ['yoga'], type: 'yoga' },
  { keys: ['pilates'], type: 'pilates' },
  { keys: ['padel', 'tennis'], type: 'padel' },
  { keys: ['box', 'punch'], type: 'boxing' },
  { keys: ['swim', 'pool'], type: 'swimming' },
  { keys: ['hik', 'trail'], type: 'hiking' },
  { keys: ['row'], type: 'rowing' },
]

export function pickIconType(text) {
  const lower = text.toLowerCase()
  for (const { keys, type } of KEYWORDS) {
    if (keys.some((k) => lower.includes(k))) return type
  }
  return 'fire'
}

export default function SportIcon({ type, size = 20, className = '' }) {
  const path = PATHS[type] ?? PATHS.fire
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {path}
    </svg>
  )
}
