const skeletonCards = Array.from({ length: 8 }, (_, index) => index);

export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-5">
      <span className="sr-only">Loading dashboard</span>

      <div className="h-[104px] animate-pulse rounded-xl border border-card-border bg-surface" />
      <div className="h-[76px] animate-pulse rounded-xl border border-card-border bg-subtle" />

      <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 2xl:grid-cols-4">
        {skeletonCards.map((card) => (
          <div
            key={card}
            className="min-h-[185px] animate-pulse rounded-xl border border-card-border bg-surface p-[30px]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="h-5 w-36 rounded bg-subtle" />
              <div className="size-[66px] rounded-full bg-subtle" />
            </div>
            <div className="mt-14 h-8 w-44 rounded bg-subtle" />
            <div className="mt-3 h-4 w-28 rounded bg-subtle" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="h-[430px] animate-pulse rounded-xl border border-card-border bg-surface" />
        <div className="h-[430px] animate-pulse rounded-xl border border-card-border bg-surface" />
      </div>
    </div>
  );
}
