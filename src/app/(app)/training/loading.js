import { Skeleton, SkeletonCard } from '@/components/Skeleton'

export default function TrainingLoading() {
  return (
    <SkeletonCard>
      <div className="flex items-center justify-between mb-2">
        <div>
          <Skeleton className="h-3 w-12" />
          <Skeleton className="mt-2 h-7 w-40" />
        </div>
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-4 w-3/4 mb-5" />

      <Skeleton className="h-3 w-32 mb-3" />
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[60, 80, 100, 70, 90, 75, 85].map((w, i) => (
          <Skeleton key={i} className="h-7" style={{ width: `${w}px` }} />
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/6" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonCard>
  )
}
