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
import { PanelMarcaAuth, MarcaCompactaAuth } from '../_componentes/panel-marca'

const recoverySchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
})

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
      // El link vuelve a nuestro callback, que canjea el token y redirige a
      // /restablecer-password con sesión activa.
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
    <div className="flex min-h-screen bg-white">
      <PanelMarcaAuth />

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <MarcaCompactaAuth />

          {isSuccess ? (
            <div>
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55', borderRadius: '0.3rem' }}
              >
                <MailCheck className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
                Te enviamos el enlace
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#525b63]">
                Si <strong className="text-[#191c1e]">{emailEnviado}</strong> coincide con una
                cuenta activa, vas a recibir un enlace para elegir una nueva contraseña. Puede
                tardar un par de minutos.
              </p>
              <p className="mt-4 rounded-md bg-[#f2f4f6] px-4 py-3 text-xs leading-relaxed text-[#525b63]">
                ¿No lo ves en tu bandeja? Revisá la carpeta de spam o correo no deseado.
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
                  className="flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] transition-colors hover:text-[#191c1e]"
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
                className="mb-6 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] transition-colors hover:text-[#191c1e]"
              >
                <ArrowLeft className="mr-1 h-3 w-3" />
                Volver al inicio de sesión
              </Link>

              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#525b63]">
                Ingresá el correo con el que accedés a UIAB Conecta y te enviamos un enlace seguro
                para elegir una nueva.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
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
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-md bg-[#00213f] text-[15px] font-semibold text-white hover:bg-[#10375c]"
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
      </main>
    </div>
  )
}
