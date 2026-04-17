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
    supabase.from('tags').select('id, nombre, tipo_tag').eq('activo', true).order('nombre'),
  ]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-inter pb-24">
      {/* ─── Premium Header ─── */}
      <div className="relative h-[300px] flex items-center overflow-hidden -mt-24 pt-24 mb-12">
        <div className="absolute inset-0 z-0">
          <Image
            src="/landing/hero-industrial.png"
            alt="Fondo Industrial"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00182e] via-[#00213f]/90 to-[#10375c]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#00213f] to-transparent opacity-90" />
        </div>

        <div className="relative z-10 w-full max-w-[1128px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <Link href="/oportunidades" className="inline-flex items-center text-blue-200/80 hover:text-white mb-6 transition-colors text-xs font-bold tracking-widest uppercase">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Oportunidades
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white text-[#00213f] rounded-lg flex items-center justify-center shadow-md border border-white/10 shrink-0">
              <Briefcase className="w-10 h-10 text-primary-600" />
            </div>
            <div>
              <h1 className="font-manrope text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-md">
                Publicar Requerimiento
              </h1>
              <p className="text-blue-100/90 mt-2 text-sm max-w-xl">
                Carga los detalles de la obra, servicio o producto que tu organización necesita.
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
