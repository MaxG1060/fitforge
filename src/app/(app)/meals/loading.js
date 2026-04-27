import { Skeleton, SkeletonCard } from '@/components/Skeleton'

export default function MealsLoading() {
  return (
    <SkeletonCard>
      <div className="flex items-center justify-between mb-2">
        <div>
          <Skeleton className="h-3 w-12" />
          <Skeleton className="mt-2 h-7 w-40" />
        </div>
        <Skeleton className="h-7 w-24" />
      </div>
      <Skeleton className="h-4 w-2/3 mb-5" />

      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-900 bg-black/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-3 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonCard>
  )
}
