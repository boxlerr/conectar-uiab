import Image from "next/image";
import { ogPorRuta } from "@/lib/seo/og";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Building2, CheckCircle2, Users } from "lucide-react";
import { FormularioAlta } from "./FormularioAlta";
import { CATEGORIA_ALTA_LABEL } from "@/modulos/altas/constantes";

export const metadata = {
  // Sin pipe adentro: el template raíz ya agrega " | UIAB Conecta" y el
  // title salía con doble pipe y 66 caracteres.
  title: "Sumate — Alta de socios UIAB",
  description:
    "Formulario exclusivo para organizaciones socias de la UIAB: verificamos tus datos contra el padrón y activamos el acceso de tu empresa a UIAB Conecta.",
  alternates: { canonical: "/sumate" },
  ...ogPorRuta(
    "Sumate — Alta de socios UIAB",
    "Verificamos tus datos contra el padrón y activamos el acceso de tu empresa a UIAB Conecta.",
    "/sumate"
  ),
};

// El listado se actualiza a medida que las empresas completan el formulario.
export const revalidate = 60;

type AltaPublica = {
  razon_social: string;
  nombre_comercial: string | null;
  categoria: string;
  localidad: string | null;
  creado_en: string;
  /** Logo de la empresa ya cargada en la plataforma, si la pudimos identificar. */
  logoUrl: string | null;
};

type EmpresaConLogo = {
  razon_social: string | null;
  nombre_comercial: string | null;
  cuit: string | null;
  bucket_logo: string | null;
  ruta_logo: string | null;
};

type AltaFila = {
  razon_social: string;
  nombre_comercial: string | null;
  cuit: string | null;
  categoria: string;
  localidad: string | null;
  creado_en: string;
};

/** CUIT comparable: sólo dígitos ("30-71232689-8" → "30712326898"). */
const normalizarCuit = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

/**
 * Nombre comparable: sin acentos, sin espacios ni puntuación y sin la forma
 * societaria del final. Así "A. D. BARBIERI S.A." (padrón) y "A.D. Barbieri"
 * (formulario) caen en la misma clave.
 */
const FORMA_SOCIETARIA = /(sas|srl|saic|sacif|sacifia|sca|scs|sh|sa|ltda)$/;

function clavesDeNombre(v: string | null | undefined): string[] {
  if (!v) return [];
  const base = v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // marcas de acento
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (base.length < 6) return []; // demasiado corto: se presta a falsos positivos
  const sinForma = base.replace(FORMA_SOCIETARIA, "");
  // Sólo usamos la versión recortada si sigue siendo un nombre reconocible.
  return sinForma.length >= 6 && sinForma !== base ? [base, sinForma] : [base];
}

/**
 * Logos de las empresas ya cargadas, indexados por CUIT y por nombre para poder
 * cruzarlos con las altas. El CUIT manda; el nombre es el plan B y se descarta
 * si dos empresas comparten la misma clave (mejor sin logo que con el ajeno).
 */
async function getIndiceLogos(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("empresas")
    .select("razon_social, nombre_comercial, cuit, bucket_logo, ruta_logo")
    .eq("estado", "aprobada")
    .not("ruta_logo", "is", null);

  const porCuit = new Map<string, string>();
  const porNombre = new Map<string, string | null>(); // null = clave ambigua

  for (const emp of (data as EmpresaConLogo[] | null) ?? []) {
    if (!emp.bucket_logo || !emp.ruta_logo) continue;
    const logoUrl = supabase.storage.from(emp.bucket_logo).getPublicUrl(emp.ruta_logo)
      .data.publicUrl;

    const cuit = normalizarCuit(emp.cuit);
    if (cuit) porCuit.set(cuit, logoUrl);

    const claves = new Set([
      ...clavesDeNombre(emp.razon_social),
      ...clavesDeNombre(emp.nombre_comercial),
    ]);
    for (const clave of claves) {
      const previo = porNombre.get(clave);
      porNombre.set(clave, previo === undefined || previo === logoUrl ? logoUrl : null);
    }
  }

  return { porCuit, porNombre };
}

async function getAltasPublicas(): Promise<AltaPublica[]> {
  // Sólo columnas NO sensibles. Email/teléfono nunca salen al público; el CUIT
  // se usa acá dentro para cruzar el logo y tampoco se renderiza.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data }, { porCuit, porNombre }] = await Promise.all([
    supabase
      .from("altas_socios")
      .select("razon_social, nombre_comercial, cuit, categoria, localidad, creado_en")
      .neq("estado", "descartado")
      .order("creado_en", { ascending: false })
      .limit(120),
    getIndiceLogos(supabase),
  ]);

  return ((data as AltaFila[] | null) ?? []).map((alta) => {
    const porNombreAlta = [
      ...clavesDeNombre(alta.razon_social),
      ...clavesDeNombre(alta.nombre_comercial),
    ]
      .map((clave) => porNombre.get(clave))
      .find((url) => !!url);

    return {
      razon_social: alta.razon_social,
      nombre_comercial: alta.nombre_comercial,
      categoria: alta.categoria,
      localidad: alta.localidad,
      creado_en: alta.creado_en,
      logoUrl: porCuit.get(normalizarCuit(alta.cuit)) ?? porNombreAlta ?? null,
    };
  });
}

type ParamsSumate = {
  desde?: string; empresa?: string; comercial?: string; cuit?: string;
  email?: string; telefono?: string; localidad?: string; referente?: string;
};

export default async function SumatePage({
  searchParams,
}: {
  searchParams: Promise<ParamsSumate>;
}) {
  // Los datos vienen de /register: si la empresa ya está en el padrón se corta
  // el registro y se la manda acá, con lo que ya había escrito puesto.
  const params = await searchParams;
  const altas = await getAltasPublicas();

  return (
    <div className="min-h-svh bg-[#f7f9fb] selection:bg-primary/10">
      {/* ─── Hero ─── */}
      <section className="relative pt-20 md:pt-28 pb-14 md:pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f2f4f6] -z-0 hidden lg:block" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[11px] sm:text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Alta exclusiva para socios UIAB
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
                Este formulario es exclusivo para organizaciones socias de la UIAB: lo usamos
                para verificar tus datos contra el padrón y activar el acceso de tu empresa a
                la plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Precio a la vista (pedido reunión 21-jul): socias sin cargo; el resto,
          membresía única. Montos reales en src/lib/mercadopago/suscripciones.ts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="rounded-xl bg-[#00213f] text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 shadow-xl shadow-[#00213f]/10">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
          <p
            className="text-sm leading-relaxed text-white/80"
            style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
          >
            <span className="font-bold text-white">Sos socia UIAB: no pagás nada.</span> La membresía
            ya está incluida en tu cuota.{" "}
            <span className="text-white/50">
              ¿Todavía no sos socia? La membresía sale $50.000/mes, o $41.667/mes pagando el año
              (<span className="text-emerald-300 font-bold">2 meses gratis</span>).
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Formulario ─── */}
          <div className="lg:col-span-7">
            <FormularioAlta
              desdeRegistro={params.desde === "registro"}
              inicial={{
                razon_social: params.empresa ?? "",
                nombre_comercial: params.comercial ?? "",
                cuit: params.cuit ?? "",
                email: params.email ?? "",
                telefono: params.telefono ?? "",
                localidad: params.localidad ?? "",
                referente_nombre: params.referente ?? "",
              }}
            />
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
                        {a.logoUrl ? (
                          // Caja apaisada: la mayoría de los logos son horizontales
                          // y en un cuadrado de 40px quedan ilegibles.
                          <div className="w-16 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            <Image
                              src={a.logoUrl}
                              alt={`Logo de ${nombre}`}
                              width={128}
                              height={96}
                              className="w-full h-full object-contain p-1.5"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-12 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center font-bold uppercase shrink-0 text-base">
                            {nombre.charAt(0)}
                          </div>
                        )}
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
