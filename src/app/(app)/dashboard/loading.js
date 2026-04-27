import { Skeleton, SkeletonCard, SkeletonHeader } from '@/components/Skeleton'

export default function DashboardLoading() {
  return (
    <>
      <SkeletonHeader titleWidth="50%" />

      <SkeletonCard>
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
      </SkeletonCard>

      <div>
        <Skeleton className="h-3 w-12 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-3 h-10 w-24" />
            </SkeletonCard>
          ))}
        </div>
      </div>

      <SkeletonCard>
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-48 w-full" />
      </SkeletonCard>

      <SkeletonCard>
        <Skeleton className="h-3 w-24 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </SkeletonCard>
    </>
  )
}
