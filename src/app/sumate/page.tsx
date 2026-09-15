import Image from "next/image";
import Link from "next/link";
import { ogPorRuta } from "@/lib/seo/og";
import { createClient } from "@supabase/supabase-js";
import { Building2, CheckCircle2, Users } from "lucide-react";
import { FormularioAlta } from "./FormularioAlta";
import { ayudaWhatsApp, CONSULTAS } from "@/lib/soporte";

export const metadata = {
  // Sin pipe adentro: el template raíz ya agrega " | UIAB Conecta" y el
  // title salía con doble pipe y 66 caracteres.
  title: "Sumate a UIAB Conecta",
  description:
    "Pedí el acceso para manejar la ficha de tu empresa en el directorio de la UIAB. Si tu empresa es socia no tiene costo; si todavía no lo es, podés crear tu cuenta.",
  alternates: { canonical: "/sumate" },
  ...ogPorRuta(
    "Sumate a UIAB Conecta",
    "Pedí el acceso para manejar la ficha de tu empresa en el directorio de la UIAB.",
    "/sumate"
  ),
};

// El listado se actualiza a medida que las empresas completan el formulario.
export const revalidate = 60;

type EmpresaPublicada = {
  nombre: string;
  localidad: string | null;
  logoUrl: string | null;
};

/**
 * Las empresas que YA están publicadas en el directorio.
 *
 * Antes esto leía `altas_socios` filtrando sólo `estado != 'descartado'`, o sea
 * que la lista titulada "Empresas que ya se sumaron", con un tilde verde por
 * fila, era literalmente la COLA DE SOLICITUDES PENDIENTES. Dos problemas: la
 * empresa se veía a sí misma con un check verde a los dos segundos de enviar el
 * formulario —la señal exacta de "ya está, no hago nada más", cuando todavía no
 * tenía cuenta— y además publicaba para siempre el nombre y la localidad de
 * empresas que sólo habían llenado un formulario y quizá nunca se aprobaron.
 *
 * Leyendo `empresas` aprobadas se arregla lo uno y lo otro, y de paso desaparece
 * todo el cruce por CUIT y por nombre normalizado que hacía falta para pegarle
 * el logo a cada alta: acá el logo viene en la misma fila.
 */
async function getEmpresasPublicadas(): Promise<EmpresaPublicada[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Sólo columnas públicas: lo mismo que ya muestra /directorio sin sesión.
  const { data } = await supabase
    .from("empresas")
    .select("razon_social, nombre_comercial, localidad, bucket_logo, ruta_logo")
    .eq("estado", "aprobada")
    .order("razon_social", { ascending: true })
    .limit(120);

  return ((data as EmpresaFila[] | null) ?? []).map((emp) => ({
    nombre: emp.nombre_comercial || emp.razon_social,
    localidad: emp.localidad,
    logoUrl:
      emp.bucket_logo && emp.ruta_logo
        ? supabase.storage.from(emp.bucket_logo).getPublicUrl(emp.ruta_logo).data.publicUrl
        : null,
  }));
}

type EmpresaFila = {
  razon_social: string;
  nombre_comercial: string | null;
  localidad: string | null;
  bucket_logo: string | null;
  ruta_logo: string | null;
};

type ParamsSumate = {
  desde?: string; empresa?: string; comercial?: string; cuit?: string;
  email?: string; telefono?: string; localidad?: string; referente?: string;
  /** "si" = ya contestó la pregunta de entrada y va derecho al formulario. */
  socia?: string;
};

export default async function SumatePage({
  searchParams,
}: {
  searchParams: Promise<ParamsSumate>;
}) {
  // Los datos vienen de /register: si la empresa ya está en el padrón se corta
  // el registro y se la manda acá, con lo que ya había escrito puesto.
  const params = await searchParams;
  const publicadas = await getEmpresasPublicadas();

  /**
   * La pregunta de entrada sólo aparece cuando la persona llega en frío.
   *
   * Por qué existe: /sumate daba por sentado que quien entraba ya era socia, y
   * a quien no lo era lo rechazaba recién al final, con un toast, después de
   * haber cargado quince campos. Peor todavía: una socia rebotada desde
   * /register llegaba con el checkbox destildado y no lo tildaba —el sistema
   * acababa de decirle que YA era socia— así que el error la mandaba de vuelta
   * a /register, que la volvía a mandar acá. Preguntar primero corta el loop y
   * manda a cada uno por su camino antes de pedirle un solo dato.
   *
   * Si ya sabemos la respuesta (viene de /register, del panel de la UIAB, o ya
   * contestó) no se le pregunta de nuevo.
   */
  const yaSabemosQueEsSocia =
    params.socia === "si" ||
    params.desde === "registro" ||
    Boolean(params.empresa || params.cuit || params.referente);

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
                Acceso para socias de la UIAB
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[1.05] pt-1"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Pedí el acceso <br />
                <span className="text-primary/30">de tu empresa</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Tu empresa ya figura en el directorio de la UIAB. Con este formulario pedís el
                usuario para entrar y manejar tu ficha vos. Lo revisa alguien de la UIAB y te
                llega un mail para que elijas tu contraseña.
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
            <span className="font-bold text-white">Sos socia de la UIAB: no pagás nada.</span> El
            acceso ya está incluido en tu cuota de socia.
          </p>
        </div>
      </div>

      {!yaSabemosQueEsSocia ? (
        /* ─── La pregunta de entrada ───
           Dos botones grandes, uno arriba del otro en mobile. No son tarjetas ni
           radios a propósito: para este público el patrón que menos falla es un
           botón que se ve como botón y que al tocarlo pasa algo. */
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-primary/5 p-6 sm:p-9">
            <h2
              className="text-2xl sm:text-3xl font-black text-[#00213f] tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              ¿Tu empresa es socia de la UIAB?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Según qué contestes, el camino es distinto.
            </p>

            <div className="mt-7 space-y-4">
              <Link
                href="/sumate?socia=si"
                className="group flex items-start gap-4 rounded-xl border-2 border-[#00213f] bg-[#00213f] px-5 py-5 text-left text-white transition-colors hover:bg-[#10375c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00213f] focus-visible:ring-offset-2"
              >
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-300 mt-0.5" aria-hidden="true" />
                <span>
                  <span className="block text-lg font-bold">Sí, ya somos socias</span>
                  <span className="block text-sm text-white/70 mt-1">
                    No pagás nada. Te pedimos unos datos y la UIAB te habilita el acceso.
                  </span>
                </span>
              </Link>

              <Link
                href="/register"
                className="group flex items-start gap-4 rounded-xl border-2 border-slate-200 bg-white px-5 py-5 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00213f] focus-visible:ring-offset-2"
              >
                <Building2 className="w-6 h-6 shrink-0 text-slate-400 mt-0.5" aria-hidden="true" />
                <span>
                  <span className="block text-lg font-bold text-[#00213f]">No, todavía no</span>
                  <span className="block text-sm text-slate-500 mt-1">
                    Podés crear tu cuenta y usar la plataforma con una membresía.
                  </span>
                </span>
              </Link>
            </div>

            <p className="mt-7 text-sm text-slate-500">
              ¿No sabés si tu empresa es socia?{" "}
              <a
                href={ayudaWhatsApp(CONSULTAS.esSocia)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary-600 underline underline-offset-2"
              >
                Escribinos por WhatsApp
              </a>{" "}
              y lo vemos con vos.
            </p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ─── Formulario ─── */}
          <div className="lg:col-span-7">
            <FormularioAlta
              desdeRegistro={params.desde === "registro"}
              inicial={{
                // Ya contestó que es socia en la pregunta de entrada (o llegó
                // rebotada desde /register, que es el sistema diciéndole que lo
                // es): volver a pedirle que lo tilde era el paso donde se trababa.
                ya_es_socio: true,
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
                  <h2 className="font-bold tracking-tight">Ya están en el directorio</h2>
                  <p className="text-white/50 text-xs">
                    {publicadas.length}{" "}
                    {publicadas.length === 1
                      ? "empresa de la red UIAB"
                      : "empresas y entidades de la red UIAB"}
                  </p>
                </div>
              </div>

              {publicadas.length === 0 ? (
                <div className="p-10 text-center">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    Todavía no hay empresas publicadas. <br />¡Sé la primera!
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
                  {publicadas.map((a, i) => {
                    const nombre = a.nombre;
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
                            {a.localidad ?? "Almirante Brown"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
      )}
    </div>
  );
}
