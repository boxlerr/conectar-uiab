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
    supabase.from('categorias').select('id, nombre').order('nombre'),
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
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* ─── Premium Header ─── */}
      <div className="relative h-[320px] flex items-center overflow-hidden -mt-24 pt-24 mb-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.webp"
            alt="Fondo Industrial"
            fill
            className="object-cover object-center opacity-[0.35]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/90 to-[#10375c]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
          {/* Grilla fina: el textil visual de la casa sobre los heros oscuros. */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1128px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <Link
            href="/oportunidades"
            className="inline-flex items-center gap-2 mb-6 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a oportunidades
          </Link>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white text-[#00213f] rounded-lg flex items-center justify-center shadow-md border border-white/10 shrink-0">
              <Briefcase className="w-10 h-10 text-[#00213f]" />
            </div>
            <div>
              <h1
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight drop-shadow-md"
              >
                Publicar un requerimiento
              </h1>
              <p className="text-blue-100/90 mt-2 text-sm max-w-xl leading-relaxed">
                Contanos qué obra, servicio o producto necesita tu organización. Lo cruzamos
                con las empresas socias y los prestadores verificados de la red.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1128px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-[-40px]">
        <FormularioOportunidad categorias={categorias || []} tags={tags || []} />
      </div>
    </div>
  );
}
