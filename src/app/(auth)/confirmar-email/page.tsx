import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Landing post-confirmación de email.
 *
 * Flujo: Supabase Auth → `/api/auth/callback?type=signup&token_hash=...` →
 * el callback canjea el token, establece la sesión y redirige acá.
 *
 * El usuario ya está logueado cuando llega, pero su empresa/particular
 * sigue en estado `pendiente_revision` hasta que un administrador la
 * apruebe — ese momento dispara el email que lleva a `/bienvenido`.
 */
export default function ConfirmarEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f4f6] px-4 py-12">
      <div className="w-full max-w-xl overflow-hidden rounded-md bg-white shadow-[0_16px_32px_-16px_rgba(0,33,63,0.18)] ring-1 ring-slate-900/[0.04]">
        {/* Barra de marca industrial */}
        <div
          className="px-8 py-6 text-white"
          style={{
            background:
              'linear-gradient(135deg, #00213f 0%, #10375c 100%)',
          }}
        >
          <p className="font-extrabold tracking-tight text-xl">
            Conectar <span className="font-semibold opacity-75">UIAB</span>
          </p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
            Unión Industrial de Almirante Brown
          </p>
        </div>

        <div className="px-8 py-10 sm:px-12">
          <div
            className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-md"
            style={{ backgroundColor: '#e6ebf2', color: '#001b55' }}
          >
            <CheckCircle2 className="h-7 w-7" strokeWidth={2.25} />
          </div>

          <h1 className="text-center text-[28px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
            Cuenta confirmada
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-relaxed text-[#525b63]">
            Tu dirección de correo fue verificada correctamente. Tu solicitud
            queda ahora en la cola de revisión del equipo de la UIAB.
          </p>

          <div className="mx-auto mt-8 max-w-md rounded-md bg-[#f2f4f6] p-5 text-sm leading-relaxed text-[#191c1e]">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#525b63]">
              Próximo paso
            </p>
            Un administrador va a validar los datos de tu empresa o perfil. En
            cuanto sea aprobado, vas a recibir un correo con el enlace para
            acceder a la plataforma.
          </div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 w-full max-w-xs rounded-md bg-[#00213f] text-white hover:bg-[#10375c]"
            >
              <Link href="/dashboard">
                Ir a mi panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-[#525b63] hover:text-[#191c1e]"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
