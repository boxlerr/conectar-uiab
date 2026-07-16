'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/cliente'
import { definirPasswordConInvitacion } from '@/modulos/altas/invitaciones'
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
 * Formulario donde un socio recién dado de alta define su contraseña por primera vez.
 *
 * El token (del email de invitación, `?token=…`) se valida en el SERVIDOR — ver
 * page.tsx / invitaciones-core.ts — y el resultado llega como props. Acá sólo
 * fijamos la contraseña (server action) y auto-logueamos. El token es propio,
 * válido 30 días y de un solo uso, no el link nativo de Supabase que vence.
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

type EstadoLink = 'ok' | 'invalido' | 'usado' | 'expirado'

const MENSAJE_LINK: Record<Exclude<EstadoLink, 'ok'>, { titulo: string; texto: string }> = {
  invalido: {
    titulo: 'Enlace no válido',
    texto: 'El enlace no es correcto o está incompleto. Pedile al equipo de UIAB que te reenvíe la invitación.',
  },
  usado: {
    titulo: 'Este enlace ya fue utilizado',
    texto: 'Ya definiste tu contraseña con este enlace. Ingresá con tu email y tu clave.',
  },
  expirado: {
    titulo: 'El enlace venció',
    texto: 'Por seguridad, la invitación tiene una duración limitada. Pedile al equipo de UIAB que te reenvíe una nueva.',
  },
}

export function FormDefinirPassword({
  token,
  estadoInicial,
  email,
}: {
  token: string
  estadoInicial: EstadoLink
  email: string | null
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [estadoLink, setEstadoLink] = useState<EstadoLink>(estadoInicial)

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const password = form.watch('password')
  const requisitos = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]

  async function onSubmit(values: Valores) {
    setIsLoading(true)
    try {
      const res = await definirPasswordConInvitacion(token, values.password)
      if (!res.ok) {
        toast.error('No pudimos definir la contraseña', { description: res.error })
        if (/utilizado/i.test(res.error)) setEstadoLink('usado')
        else if (/venció|vencio/i.test(res.error)) setEstadoLink('expirado')
        setIsLoading(false)
        return
      }

      // Auto-login: la contraseña ya quedó fijada, entramos con ella.
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: res.email,
        password: values.password,
      })

      setIsSuccess(true)
      if (signErr) {
        toast.success('Contraseña definida', {
          description: 'Ya podés iniciar sesión con tu nueva clave.',
        })
        setTimeout(() => router.push('/login'), 1800)
      } else {
        toast.success('¡Listo! Bienvenido a UIAB Conecta', {
          description: 'Te estamos llevando a tu panel…',
        })
        // Redirect a /dashboard: ahí se dispara el tutorial de primer ingreso.
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 1200)
      }
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
            Activá tu cuenta
          </p>
        </div>

        <div className="px-8 py-9">
          <Link
            href="/login"
            className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525b63] hover:text-[#191c1e]"
          >
            <ArrowLeft className="mr-1 h-3 w-3" />
            Ir al login
          </Link>

          {estadoLink !== 'ok' && (
            <div className="mt-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                {MENSAJE_LINK[estadoLink].titulo}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#525b63]">
                {MENSAJE_LINK[estadoLink].texto}
              </p>
              <Button
                asChild
                className="mt-6 h-11 w-full rounded-md bg-[#00213f] text-white hover:bg-[#10375c]"
              >
                <Link href="/login">Ir al login</Link>
              </Button>
            </div>
          )}

          {estadoLink === 'ok' && !isSuccess && (
            <>
              <div className="mt-4 mb-7">
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md"
                  style={{ backgroundColor: '#e6ebf2', color: '#001b55' }}
                >
                  <KeyRound className="h-5 w-5" strokeWidth={2.25} />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#191c1e]">
                  Definí tu contraseña
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[#525b63]">
                  Elegí una clave segura para{' '}
                  {email ? <strong className="text-[#191c1e]">{email}</strong> : 'tu cuenta'}. La
                  vas a usar para ingresar a Conectar UIAB.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#191c1e]">Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPass ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="bg-[#f2f4f6] pr-10 focus:bg-white"
                              autoComplete="new-password"
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
                        <FormLabel className="text-[#191c1e]">Confirmar contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type={showPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="bg-[#f2f4f6] focus:bg-white"
                            autoComplete="new-password"
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
                      'Activar mi cuenta'
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
                ¡Cuenta activada!
              </h2>
              <p className="mt-2 text-sm text-[#525b63]">Te estamos llevando a la plataforma…</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
