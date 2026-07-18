// Skeleton que se muestra al instante al navegar a /dashboard mientras el
// server component resuelve sus consultas. Espeja la estructura real (hero +
// KPIs + grilla 8/4) para que el salto al contenido no "brinque".
export default function LoadingDashboard() {
  return (
    <main className="min-h-screen bg-[#f2f5f8] animate-pulse">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 space-y-5">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00182f] via-[#042848] to-[#0c3260] px-6 sm:px-10 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-7">
            <div className="flex items-center gap-5 sm:gap-6 min-w-0 flex-1">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/15 shrink-0" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-24 bg-white/15 rounded-full" />
                <div className="h-9 w-64 max-w-full bg-white/20 rounded-lg" />
                <div className="h-3 w-40 bg-white/10 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-11 w-28 bg-white/15 rounded-xl" />
              <div className="h-11 w-28 bg-white/10 rounded-xl" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 lg:p-6 border border-slate-200/50">
              <div className="w-10 h-10 rounded-xl bg-slate-100 mb-4" />
              <div className="h-9 w-16 bg-slate-100 rounded mb-3" />
              <div className="h-2.5 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Main grid 8/4 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden">
                <div className="px-7 py-5 border-b border-slate-100">
                  <div className="h-3 w-48 bg-slate-100 rounded" />
                </div>
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
                        <div className="h-2.5 w-1/3 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/50 p-6 space-y-4">
                <div className="h-3 w-32 bg-slate-100 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
