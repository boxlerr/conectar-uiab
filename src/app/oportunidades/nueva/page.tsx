import { createClient } from "@/lib/supabase/servidor";
import { redirect } from "next/navigation";
import { FormularioOportunidad } from "./FormularioOportunidad";
import { Briefcase, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function NuevaOportunidadPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?callbackUrl=/oportunidades/nueva");
  }

  // Cargar categorías activas y tags disponibles en paralelo
  const [{ data: categorias }, { data: tags }] = await Promise.all([
    // `activa` importa: /admin/servicios permite dar de baja un rubro, y sin este
    // filtro el rubro dado de baja seguía ofreciéndose sólo acá.
    supabase.from('categorias').select('id, nombre').eq('activa', true).order('nombre'),
    // Sólo el catálogo curado: una etiqueta inventada acá matchearía contra
    // cero candidatos y diluiría el puntaje de tags de todos los demás.
    supabase
      .from('tags')
      .select('id, nombre, tipo_tag')
      .eq('activo', true)
      .eq('administrado_por_admin', true)
      .order('nombre'),
  ]);

  return (
    /*
      Sin `pt-20 lg:pt-24`: el Header ya emite su propio spacer de esa misma
      altura (encabezado.tsx), así que repetirlo acá sumaba una franja en blanco
      de 96px antes de la tarjeta. El viejo hero a sangre lo compensaba con un
      margen negativo; este no lo necesita.
    */
    <div className="min-h-svh bg-slate-50 pb-16">
      <div className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-7">
        {/*
          Encabezado en tarjeta, igual que el de /oportunidades: las dos pantallas
          son la misma sección y antes no se parecían en nada — esta abría con una
          foto industrial a sangre de 320px de alto y la otra con una tarjeta navy.
        */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#00213f] text-white shadow-[0_28px_60px_-32px_rgba(0,33,63,0.75)]">
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#0b2d4d] to-[#123a63]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            aria-hidden="true"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary-500/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid items-center gap-6 p-6 sm:px-9 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-10 lg:py-7">
            <div>
              <Link
                href="/oportunidades"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a oportunidades
              </Link>

              <div className="mt-4 flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-black/25">
                  <Briefcase className="h-6 w-6" />
                </span>
                <div>
                  <h1
                    style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    className="text-3xl font-black leading-tight tracking-tight"
                  >
                    Publicar un requerimiento
                  </h1>
                  <p
                    className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/65"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                  >
                    Contanos qué material, servicio, producto o personal necesita tu
                    organización. Lo cruzamos con las empresas socias y los prestadores
                    verificados de la red.
                  </p>
                </div>
              </div>
            </div>

            {/* La ilustración es lo que fija el alto de la tarjeta: con 190px de
                ancho la empujaba a ~300px. A 150 el bloque de texto manda. */}
            <Image
              src="/landing/nueva-oportunidad-hero.webp"
              alt=""
              aria-hidden="true"
              width={820}
              height={1125}
              priority
              className="hidden h-auto w-[150px] select-none justify-self-end xl:block"
            />
          </div>
        </section>

        <FormularioOportunidad categorias={categorias || []} tags={tags || []} />
      </div>
    </div>
  );
}
