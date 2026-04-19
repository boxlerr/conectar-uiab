'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/cliente'
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
import { cn } from '@/lib/utilidades'

/**
 * Formulario de reseteo de contraseña.
 *
 * Pre-requisito: el usuario llegó acá vía el link del correo de recuperación,
 * que pasa por `/api/auth/callback?type=recovery&...`. Ese callback canjea el
 * token y establece una sesión temporal de recovery. Acá sólo llamamos
 * `supabase.auth.updateUser({ password })` y listo.
 *
 * Si por alguna razón no hay sesión (link expirado o link abierto en otro
 * navegador), mostramos un estado claro con CTA a `/recovery`.
 */

const schema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Mínimo 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Al menos una mayúscula' })
      .regex(/[0-9]/, { message: 'Al menos un número' }),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type Valores = z.infer<typeof schema>

export default function RestablecerPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [estadoSesion, setEstadoSesion] = useState<
    'verificando' | 'ok' | 'sinSesion'
  >('verificando')

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // Verificar que llegamos con una sesión válida (de recovery o cualquiera).
  useEffect(() => {
    let cancelado = false
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      if (cancelado) return
      setEstadoSesion(data.session ? 'ok' : 'sinSesion')
    })

    // Supabase también emite `PASSWORD_RECOVERY` si el link se abrió en el
    // mismo navegador — es una señal extra para habilitar el form.
    const { data: sub } = supabase.auth.onAuthStateChange((evento: string) => {
      if (evento === 'PASSWORD_RECOVERY') setEstadoSesion('ok')
    })
    return () => {
      cancelado = true
      sub.subscription.unsubscribe()
    }
  }, [supabase])

  const password = form.watch('password')
  const requisitos = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]

  async function onSubmit(values: Valores) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (error) {
        toast.error('No pudimos actualizar la contraseña', {
          description: error.message,
        })
        setIsLoading(false)
        return
      }
      setIsSuccess(true)
      toast.success('Contraseña actualizada', {
        description: 'Ya podés ingresar con tu nueva clave.',
      })
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Intentá nuevamente en unos minutos.'
      toast.error('Error de sistema', { description: msg })
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f4f6] px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-[0_16px_32px_-16px_rgba(0,33,63,0.18)] ring-1 ring-slate-900/[0.04]">
        <div
          className="px-8 py-5 text-white"
          style={{ background: 'linear-gradient(135deg, #00213f 0%, #10375c 100%)' }}
        >
          <p className="font-extrabold tracking-tight text-lg">
            Conectar <span className="font-semibold opacity-75">UIAB</span>
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/65">
            Restablecer acceso
          </p>
        </div>

        <div className="px-8 py-9">
          <Link
            href="/login"
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] hover:text-[#191c1e]"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Volver al login
          </Link>

          {estadoSesion === 'verificando' && (
            <div className="py-14 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#00213f]" />
              <p className="mt-3 text-sm text-[#525b63]">Verificando el enlace…</p>
            </div>
          )}

          {estadoSesion === 'sinSesion' && (
            <div className="mt-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Enlace no válido o expirado
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#525b63]">
                Para tu seguridad, los enlaces de recuperación tienen una
                duración limitada. Pedí uno nuevo y volvé a intentarlo.
              </p>
              <Button
                asChild
                className="mt-6 h-11 w-full rounded-md bg-[#00213f] text-white hover:bg-[#10375c]"
              >
                <Link href="/recovery">Pedir un nuevo enlace</Link>
              </Button>
            </div>
          )}

          {estadoSesion === 'ok' && !isSuccess && (
            <>
              <div className="mt-4 mb-7">
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md"
                  style={{ backgroundColor: '#e6ebf2', color: '#001b55' }}
                >
                  <KeyRound className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                  Definí tu nueva contraseña
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#525b63]">
                  Elegí una clave segura. La vas a usar para ingresar a tu
                  cuenta de Conectar UIAB.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191c1e]">
                          Nueva contraseña
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPass ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="bg-[#f2f4f6] pr-10 focus:bg-white"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525b63] hover:text-[#191c1e]"
                              tabIndex={-1}
                            >
                              {showPass ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ul className="space-y-1.5">
                    {requisitos.map((r) => (
                      <li
                        key={r.label}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          r.ok ? 'text-[#001b55]' : 'text-[#525b63]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded-sm',
                            r.ok ? 'bg-[#001b55] text-white' : 'bg-[#d8dadc]'
                          )}
                        >
                          {r.ok && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        {r.label}
                      </li>
                    ))}
                  </ul>

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191c1e]">
                          Confirmar contraseña
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="bg-[#f2f4f6] focus:bg-white"
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      'Actualizar contraseña'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {isSuccess && (
            <div className="py-8 text-center">
              <div
                className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-md"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55' }}
              >
                <ShieldCheck className="h-7 w-7" strokeWidth={2.25} />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                Contraseña actualizada
              </h2>
              <p className="mt-2 text-sm text-[#525b63]">
                Te estamos llevando al login…
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
