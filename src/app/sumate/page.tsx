import { createClient } from "@supabase/supabase-js";
import { Building2, CheckCircle2, Users } from "lucide-react";
import { FormularioAlta } from "./FormularioAlta";
import { CATEGORIA_ALTA_LABEL } from "@/modulos/altas/constantes";

export const metadata = {
  title: "Sumate a UIAB Conecta | Cargá los datos de tu empresa",
  description:
    "Completá el formulario para que tu empresa acceda al directorio comercial de la Unión Industrial de Almirante Brown.",
};

// El listado se actualiza a medida que las empresas completan el formulario.
export const revalidate = 60;

type AltaPublica = {
  razon_social: string;
  nombre_comercial: string | null;
  categoria: string;
  localidad: string | null;
  creado_en: string;
};

async function getAltasPublicas(): Promise<AltaPublica[]> {
  // Sólo columnas NO sensibles. Email/teléfono nunca salen al público.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("altas_socios")
    .select("razon_social, nombre_comercial, categoria, localidad, creado_en")
    .neq("estado", "descartado")
    .order("creado_en", { ascending: false })
    .limit(120);
  return (data as AltaPublica[]) ?? [];
}

export default async function SumatePage() {
  const altas = await getAltasPublicas();

  return (
    <div className="min-h-screen bg-[#f7f9fb] selection:bg-primary/10">
      {/* ─── Hero ─── */}
      <section className="relative pt-20 md:pt-28 pb-14 md:pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f2f4f6] -z-0 hidden lg:block" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Sumate a la red industrial
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[1.05] pt-1"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Cargá los datos <br />
                <span className="text-primary/30">de tu empresa</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Completá el formulario y el equipo de UIAB te va a contactar para activar el
                acceso de tu empresa al directorio comercial de Almirante Brown.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Formulario ─── */}
          <div className="lg:col-span-7">
            <FormularioAlta />
          </div>

          {/* ─── Listado en vivo ─── */}
          <aside className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-2xl shadow-primary/5 overflow-hidden sticky top-24">
              <div className="bg-[#00213f] text-white px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold tracking-tight">Empresas que ya se sumaron</h2>
                  <p className="text-white/50 text-xs">
                    {altas.length} {altas.length === 1 ? "empresa registrada" : "empresas registradas"}
                  </p>
                </div>
              </div>

              {altas.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Todavía no hay empresas registradas. <br />¡Sé la primera!
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                  {altas.map((a, i) => {
                    const nombre = a.nombre_comercial || a.razon_social;
                    return (
                      <li key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold uppercase shrink-0 text-sm">
                          {nombre.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-sm truncate">{nombre}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {CATEGORIA_ALTA_LABEL[a.categoria] ?? a.categoria}
                            {a.localidad ? ` · ${a.localidad}` : ""}
                          </p>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
