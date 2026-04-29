import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Briefcase,
  GraduationCap,
  Network,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Página de bienvenida post-aprobación.
 *
 * Destino del botón "Acceder a la plataforma" del correo
 * `plantillaAprobacion`. El enlace del correo apunta directamente acá
 * (no requiere sesión); si el usuario no está logueado, el botón lo
 * manda al login, y desde ahí el flujo de login lo llevará a /dashboard.
 */
export default function BienvenidoPage() {
  const puntos = [
    {
      icono: Building2,
      titulo: 'Directorio industrial',
      desc: 'Acceso al listado de empresas y proveedores de servicios verificados por la UIAB.',
    },
    {
      icono: Briefcase,
      titulo: 'Oportunidades comerciales',
      desc: 'Publicá o postulate a oportunidades de contratación publicadas por la red.',
    },
    {
      icono: Network,
      titulo: 'Perfil institucional',
      desc: 'Mostrá tu actividad, rubros y datos de contacto al resto de la comunidad.',
    },
    {
      icono: GraduationCap,
      titulo: 'Capacitaciones y eventos',
      desc: 'Novedades, formación y actividades organizadas por la UIAB y sus socios.',
    },
  ]

  return (
    <main className="min-h-screen bg-[#f2f4f6]">
      {/* Encabezado con gradiente industrial */}
      <section
        className="text-white"
        style={{ background: 'linear-gradient(135deg, #00213f 0%, #10375c 100%)' }}
      >
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-sm bg-white/10 px-3 py-1.5 backdrop-blur-sm ring-1 ring-white/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
              Registro aprobado
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl font-extrabold tracking-tight text-4xl leading-[1.1] sm:text-5xl sm:leading-[1.05]">
            Bienvenida a Conectar{' '}
            <span className="opacity-75">UIAB</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/80">
            Tu solicitud fue revisada y aprobada por el equipo de la Unión
            Industrial de Almirante Brown. Ya formás parte oficial de la red
            profesional industrial más relevante del distrito.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 rounded-md bg-white px-7 text-[#00213f] hover:bg-white/90"
            >
              <Link href="/login">
                Ingresar a la plataforma
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-11 rounded-md px-5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/contacto">Hablar con la UIAB</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Qué vas a encontrar */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#525b63]">
            Lo que encontrás al ingresar
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#191c1e] sm:text-3xl">
            Todo lo que la red pone a tu disposición
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {puntos.map((p) => (
            <article
              key={p.titulo}
              className="rounded-md bg-white p-6 ring-1 ring-slate-900/[0.04] shadow-[0_8px_24px_-16px_rgba(0,33,63,0.18)]"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-md"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55' }}
              >
                <p.icono className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <h3 className="text-base font-bold text-[#191c1e]">{p.titulo}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#525b63]">
                {p.desc}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-md bg-white p-8 ring-1 ring-slate-900/[0.04]">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-extrabold text-[#191c1e]">
                Listos para empezar
              </h3>
              <p className="mt-1 text-sm text-[#525b63]">
                Iniciá sesión con el correo que usaste al registrarte.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-11 rounded-md bg-[#00213f] px-7 text-white hover:bg-[#10375c]"
            >
              <Link href="/login">
                Iniciar sesión
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
