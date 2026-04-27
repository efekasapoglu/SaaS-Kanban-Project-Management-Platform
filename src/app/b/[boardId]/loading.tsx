export default function BoardLoading() {
  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Skeleton Header */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </header>

      {/* Skeleton Canvas */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 items-start h-full">
          {[1, 2, 3].map((col) => (
            <div key={col} className="w-80 shrink-0 flex flex-col max-h-full">
              {/* Sütun Başlığı */}
              <div className="h-12 flex items-center justify-between px-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-t-xl border border-zinc-200 dark:border-zinc-800 border-b-0">
                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              {/* Sütun Gövdesi */}
              <div className="flex-1 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-b-xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
                {[1, 2].map((card) => (
                  <div key={card} className="h-24 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
