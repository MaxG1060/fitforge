export function Skeleton({ className = '', style }) {
  return <div className={`animate-pulse rounded-md bg-zinc-900 ${className}`} style={style} />
}

export function SkeletonCard({ className = '', children }) {
  return (
    <div className={`rounded-lg border border-zinc-900 bg-zinc-950 p-6 ${className}`}>
      {children}
    </div>
  )
}

export function SkeletonHeader({ eyebrow = true, titleWidth = '60%' }) {
  return (
    <div>
      {eyebrow && <Skeleton className="h-3 w-20" />}
      <Skeleton className="mt-2 h-8" style={{ width: titleWidth }} />
    </div>
  )
}
