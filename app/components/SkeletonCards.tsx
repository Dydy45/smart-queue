interface SkeletonCardsProps {
  count?: number
}

export default function SkeletonCards({ count = 3 }: SkeletonCardsProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex flex-col bg-base-200 p-5 rounded-lg gap-3">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="flex items-center gap-2 mt-2">
            <div className="skeleton h-8 w-28 rounded" />
            <div className="skeleton h-8 w-10 rounded" />
          </div>
        </li>
      ))}
    </>
  )
}
