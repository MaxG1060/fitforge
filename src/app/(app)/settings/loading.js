import { Skeleton, SkeletonCard, SkeletonHeader } from '@/components/Skeleton'

export default function SettingsLoading() {
  return (
    <>
      <SkeletonHeader titleWidth="40%" />

      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i}>
          <Skeleton className="h-3 w-24 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </SkeletonCard>
      ))}
    </>
  )
}
