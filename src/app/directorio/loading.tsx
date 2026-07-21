// Skeleton instantáneo de /directorio mientras el server resuelve
// obtenerDirectorio(). Espeja hero + sidebar de filtros + grilla de tarjetas.
export default function LoadingDirectorio() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-20 animate-pulse">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-16">
        {/* Hero */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-[2px] bg-slate-200" />
              <div className="h-3 w-32 bg-slate-200 rounded" />
            </div>
            <div className="h-11 w-80 max-w-full bg-slate-200 rounded-lg mb-3" />
            <div className="h-11 w-64 max-w-full bg-slate-200 rounded-lg" />
          </div>
          <div className="h-4 w-56 bg-slate-200 rounded md:self-end" />
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* Sidebar filtros */}
          <aside className="w-full lg:w-3/12 xl:w-1/4 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="h-10 w-full bg-slate-100 rounded" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 w-3/4 bg-slate-100 rounded" />
              ))}
            </div>
          </aside>

          {/* Grilla de tarjetas */}
          <main className="w-full lg:w-9/12 xl:w-3/4">
            <div className="mb-8 h-16 bg-white rounded-xl border border-slate-200/60" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-[320px]">
                  <div className="flex justify-between mb-6">
                    <div className="w-14 h-14 rounded-lg bg-slate-100" />
                    <div className="w-24 h-6 rounded bg-slate-100" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-100 rounded mb-3" />
                  <div className="h-3 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-5/6 bg-slate-100 rounded mb-6" />
                  <div className="pt-5 border-t border-slate-100">
                    <div className="h-8 w-full bg-slate-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
