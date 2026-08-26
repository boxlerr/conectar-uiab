// Skeleton que se muestra al instante al navegar a /panel-de-control mientras el
// server component resuelve sus consultas. Espeja la estructura real (hero +
// resumen + grilla 8/4 + novedades a lo ancho) para que el salto al contenido
// no "brinque". Si se reordena el panel, esto se reordena con él.
export default function LoadingDashboard() {
  return (
    <main className="min-h-svh animate-pulse bg-[#f2f5f8]">
      <div className="mx-auto max-w-[1320px] space-y-6 px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00182f] via-[#042848] to-[#0c3260] px-5 py-7 sm:px-8 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
            <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-6">
              <div className="h-[72px] w-[72px] shrink-0 rounded-full bg-white/15 sm:h-24 sm:w-24" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-24 rounded-full bg-white/15" />
                <div className="h-9 w-64 max-w-full rounded-lg bg-white/20" />
                <div className="h-3 w-52 rounded bg-white/10" />
                <div className="flex gap-1.5 pt-1">
                  <div className="h-6 w-40 rounded-lg bg-white/[0.07]" />
                  <div className="h-6 w-24 rounded-lg bg-white/[0.07]" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-[42px] w-32 rounded-xl bg-white/20" />
              <div className="h-[42px] w-40 rounded-xl bg-white/10" />
              <div className="h-[42px] w-[42px] rounded-xl bg-white/10" />
            </div>
          </div>
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <div className="mb-2 h-2.5 w-40 rounded bg-white/10" />
            <div className="h-[5px] rounded-full bg-white/[0.07]" />
          </div>
        </div>

        {/* Resumen general */}
        <div className="space-y-3">
          <div className="h-5 w-44 rounded bg-slate-200/70" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100" />
                  <div className="h-8 w-14 rounded bg-slate-100" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-28 rounded bg-slate-100" />
                  <div className="h-2.5 w-20 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grilla principal 8/4 */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-8">
            {/* Actividad + estadísticas */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white lg:col-span-2">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="h-3.5 w-36 rounded bg-slate-100" />
                </div>
                <div className="space-y-4 p-5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-slate-100" />
                        <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white lg:col-span-3">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="h-3.5 w-52 rounded bg-slate-100" />
                </div>
                <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,190px)_minmax(0,1fr)]">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-24 rounded bg-slate-100" />
                        <div className="h-6 w-12 rounded bg-slate-100" />
                      </div>
                    ))}
                  </div>
                  <div className="h-[150px] rounded-lg bg-slate-50 tab:h-[180px]" />
                </div>
              </div>
            </div>

            {/* Ficha + catálogo */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="h-3.5 w-48 rounded bg-slate-100" />
                </div>
                <div className="space-y-4 p-5">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-lg bg-slate-100" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-2/3 rounded bg-slate-100" />
                        <div className="h-2.5 w-1/3 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 lg:col-span-4">
            <div className="h-64 rounded-2xl bg-gradient-to-br from-[#001829] via-[#00213f] to-[#0b3268] opacity-80" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                <div className="border-b border-slate-100 px-6 py-4">
                  <div className="h-3.5 w-36 rounded bg-slate-100" />
                </div>
                <div className="space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-100" />
                      <div className="h-3 flex-1 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Novedades del sistema, a todo el ancho */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3.5 w-44 rounded bg-slate-100" />
                <div className="h-2.5 w-72 max-w-full rounded bg-slate-100" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-px bg-slate-100 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 bg-white p-6">
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-4 w-4/5 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
                <div className="space-y-2 pt-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className="h-[22px] w-[22px] shrink-0 rounded-md bg-slate-100" />
                      <div className="h-2.5 flex-1 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
