// Skeleton compartido por TODO /admin (Next lo hereda en cada subruta que no
// tenga su propio loading.tsx). Estructura genérica de panel: encabezado +
// tarjetas de resumen + tabla, para dar feedback instantáneo al navegar.
export default function LoadingAdmin() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Encabezado */}
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-200 rounded" />
          <div className="h-4 w-96 max-w-full bg-slate-100 rounded" />
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100" />
              <div className="h-8 w-14 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>

        {/* Tabla / listado */}
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="h-4 w-40 bg-slate-100 rounded" />
            <div className="h-9 w-32 bg-slate-100 rounded" />
          </div>
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 bg-slate-100 rounded" />
                  <div className="h-2.5 w-1/4 bg-slate-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
                <div className="h-8 w-24 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
