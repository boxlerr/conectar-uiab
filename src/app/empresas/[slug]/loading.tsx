export default function LoadingEmpresaProfile() {
  return (
    <div className="min-h-screen bg-slate-50 font-inter pb-20 animate-pulse">
      {/* Hero */}
      <div className="relative h-[320px] flex items-end overflow-hidden -mt-24 pt-24 bg-gradient-to-t from-[#00182e] via-[#00213f] to-[#10375c]">
        <div className="relative z-10 w-full max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 pb-10">
          <div className="h-3 w-24 bg-white/20 rounded mb-6" />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="h-6 w-28 bg-white/15 rounded-sm" />
            <div className="h-6 w-32 bg-white/10 rounded-sm" />
          </div>
          <div className="h-12 w-2/3 max-w-xl bg-white/20 rounded-lg" />
        </div>
      </div>

      {/* Identity bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-wrap items-center gap-6">
          <div className="w-20 h-20 bg-slate-200 rounded-md shrink-0" />
          <div className="flex-1 min-w-[200px] flex flex-wrap gap-x-8 gap-y-3 items-center">
            <div className="h-4 w-48 bg-slate-200 rounded" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-10 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main */}
          <main className="w-full lg:w-[72%] space-y-6">
            {[...Array(3)].map((_, i) => (
              <section key={i} className="bg-white p-7 rounded-md border border-slate-200">
                <div className="h-3 w-40 bg-slate-200 rounded mb-5" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                </div>
              </section>
            ))}
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-[28%]">
            <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="h-3 w-32 bg-slate-200 rounded" />
              </div>
              <div className="p-6 space-y-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 bg-slate-200 rounded shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 w-20 bg-slate-200 rounded" />
                      <div className="h-4 w-full bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
                <div className="h-11 w-full bg-slate-200 rounded mt-2" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
