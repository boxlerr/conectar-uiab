'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const recoverySchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
})

// Header de marca compartido con /login y /restablecer-password: barra navy con
// el gradiente institucional. En web el gradiente sí renderiza (a diferencia de
// los correos), así que acá lo mantenemos para unificar toda la zona de auth.
function EncabezadoAuth({ titulo }: { titulo: string }) {
  return (
    <div
      className="relative overflow-hidden px-8 pb-6 pt-7"
      style={{ background: 'linear-gradient(135deg, #00213f 0%, #10375c 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary-400/[0.06] blur-[80px]" />

      <div className="relative z-10 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center bg-white/[0.08] backdrop-blur-xl"
          style={{ borderRadius: '0.25rem' }}
        >
          <span className="text-xl font-bold text-white">U</span>
        </div>
        <div>
          <span
            className="block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40"
            style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
          >
            UIAB Conecta
          </span>
          <h2
            className="mt-0.5 text-xl font-bold leading-none tracking-tight text-white"
            style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
          >
            {titulo}
          </h2>
        </div>
      </div>
    </div>
  )
}

export default function RecoveryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [emailEnviado, setEmailEnviado] = useState('')

  const form = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: '' },
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  async function onSubmit(values: z.infer<typeof recoverySchema>) {
    setIsLoading(true)

    try {
      // Supabase manda el correo de recuperación usando su plantilla nativa
      // (configurable en el dashboard). El link vuelve a nuestro callback,
      // que canjea el token y redirige a /restablecer-password con sesión
      // activa.
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/restablecer-password`,
      })

      if (error) {
        toast.error('Error al solicitar recuperación', { description: error.message })
        setIsLoading(false)
        return
      }

      setEmailEnviado(values.email)
      setIsSuccess(true)
      toast.success('Solicitud enviada', {
        description: 'Revisá tu bandeja de entrada en los próximos 2 minutos.',
      })
    } catch {
      toast.error('Error de sistema', { description: 'Contactá al soporte técnico.' })
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f4f6] p-4 sm:p-6">
      <div
        className="relative z-10 w-full max-w-[440px] overflow-hidden bg-white"
        style={{ borderRadius: '0.25rem', boxShadow: '0 16px 32px rgba(25, 28, 30, 0.06)' }}
      >
        <EncabezadoAuth titulo={isSuccess ? 'Revisá tu correo' : 'Recuperar acceso'} />

        <div className="px-8 py-8">
          {isSuccess ? (
            <div className="text-center">
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55', borderRadius: '0.25rem' }}
              >
                <MailCheck className="h-7 w-7" strokeWidth={2.25} />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Te enviamos el enlace
              </h1>
              <p className="mx-auto mt-2 max-w-[320px] text-sm leading-relaxed text-[#525b63]">
                Si <strong className="text-[#191c1e]">{emailEnviado}</strong> coincide con una
                cuenta activa, vas a recibir un enlace para elegir una nueva contraseña. Puede
                tardar un par de minutos.
              </p>
              <p className="mt-4 text-xs text-[#525b63]">
                ¿No lo ves? Revisá la carpeta de spam o correo no deseado.
              </p>

              <div className="mt-7 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-md border-[#d8dadc] text-[#191c1e] hover:bg-[#f2f4f6]"
                  onClick={() => {
                    setIsSuccess(false)
                    setIsLoading(false)
                  }}
                >
                  Usar otro correo
                </Button>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] transition-colors hover:text-[#191c1e]"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] transition-colors hover:text-[#191c1e]"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Volver al inicio de sesión
              </Link>

              <div className="mb-7 mt-5 space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-sm leading-relaxed text-[#525b63]">
                  Ingresá el correo con el que accedés a UIAB Conecta y te enviamos un enlace
                  seguro para elegir una nueva contraseña.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#191c1e]/80">
                          Correo electrónico
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="responsable@empresa.com"
                            className="h-12 bg-[#f2f4f6] focus:bg-white"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-md bg-[#00213f] text-white hover:bg-[#10375c]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
