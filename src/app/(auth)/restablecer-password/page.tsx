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
import { PanelMarcaAuth, MarcaCompactaAuth } from '../_componentes/panel-marca'

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
      const { error } = await supabase.auth.updateUser({ password: values.password })
      if (error) {
        toast.error('No pudimos actualizar la contraseña', { description: error.message })
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
    <div className="flex min-h-screen bg-white">
      <PanelMarcaAuth />

      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <MarcaCompactaAuth />

          <Link
            href="/login"
            className="mb-6 inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] transition-colors hover:text-[#191c1e]"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Volver al inicio de sesión
          </Link>

          {estadoSesion === 'verificando' && (
            <div className="flex items-center gap-3 py-6 text-sm text-[#525b63]">
              <Loader2 className="h-5 w-5 animate-spin text-[#00213f]" />
              Verificando el enlace…
            </div>
          )}

          {estadoSesion === 'sinSesion' && (
            <div>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
                Enlace no válido o expirado
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#525b63]">
                Para tu seguridad, los enlaces de recuperación tienen una duración limitada. Pedí
                uno nuevo y volvé a intentarlo.
              </p>
              <Button
                asChild
                className="mt-7 h-12 w-full rounded-md bg-[#00213f] text-[15px] font-semibold text-white hover:bg-[#10375c]"
              >
                <Link href="/recovery">Pedir un nuevo enlace</Link>
              </Button>
            </div>
          )}

          {estadoSesion === 'ok' && !isSuccess && (
            <>
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55', borderRadius: '0.3rem' }}
              >
                <KeyRound className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
                Definí tu nueva contraseña
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[#525b63]">
                Elegí una clave segura. La vas a usar para ingresar a tu cuenta de UIAB Conecta.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-7 space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#191c1e]/80">
                          Nueva contraseña
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPass ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="h-12 bg-[#f2f4f6] pr-10 focus:bg-white"
                              autoFocus
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPass((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525b63] hover:text-[#191c1e]"
                              tabIndex={-1}
                            >
                              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ul className="grid grid-cols-3 gap-2">
                    {requisitos.map((r) => (
                      <li
                        key={r.label}
                        className={cn(
                          'flex items-center gap-1.5 text-[11px]',
                          r.ok ? 'text-[#001b55]' : 'text-[#525b63]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm',
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
                        <FormLabel className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#191c1e]/80">
                          Confirmar contraseña
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="h-12 bg-[#f2f4f6] focus:bg-white"
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
                      'Actualizar contraseña'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {isSuccess && (
            <div>
              <div
                className="mb-6 flex h-12 w-12 items-center justify-center"
                style={{ backgroundColor: '#e6ebf2', color: '#001b55', borderRadius: '0.3rem' }}
              >
                <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
              </div>
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#191c1e]">
                Contraseña actualizada
              </h1>
              <p className="mt-3 text-sm text-[#525b63]">Te estamos llevando al login…</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
