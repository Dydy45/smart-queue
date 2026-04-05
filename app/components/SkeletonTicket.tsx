interface SkeletonTicketProps {
  count?: number
}

function SkeletonTicketItem() {
  return (
    <div className="border p-5 border-base-300 rounded-xl flex flex-col space-y-3">
      {/* Ligne 1 : numéro + nom service + badge durée */}
      <div className="flex items-center gap-2">
        <div className="skeleton h-6 w-12 rounded-full" />
        <div className="skeleton h-6 w-40 rounded" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>

      {/* Ligne 2 : statut + nom poste | nom client */}
      <div className="flex flex-col md:flex-row md:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="skeleton h-8 w-36 rounded-lg" />
          <div className="skeleton h-4 w-20 rounded" />
        </div>
        <div className="skeleton h-5 w-32 rounded" />
      </div>

      {/* Ligne 3 : zone attente (timeline) */}
      <div className="border border-base-300 rounded-xl p-4">
        <div className="skeleton h-5 w-20 rounded-full mb-3" />
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-5 w-5 rounded-full shrink-0" />
          <div className="skeleton h-8 w-20 rounded-lg" />
          <div className="flex-1 skeleton h-1 rounded" />
          <div className="skeleton h-4 w-10 rounded" />
          <div className="skeleton h-5 w-5 rounded-full shrink-0" />
          <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function SkeletonTicket({ count = 3 }: SkeletonTicketProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTicketItem key={i} />
      ))}
    </>
  )
}
