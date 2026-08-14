'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Check, Loader2, ShieldCheck, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { completarCuenta } from './acciones'
import { llamarAccion } from '@/lib/accion-segura'
import { createClient } from '@/lib/supabase/cliente'

/**
 * La pantalla que ve alguien del equipo de la UIAB la primera vez que entra con
 * la clave provisoria que le pasaron por mensaje. No tiene botón de "después":
 * la clave provisoria es compartida y estas cuentas suelen ser de administrador,
 * así que dejarla viva sería dejar el panel abierto a quien vea ese mensaje.
 */

const schema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, { message: 'Escribí tu nombre y apellido' })
      .max(80, { message: 'Máximo 80 caracteres' }),
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

export function FormCompletarCuenta({ email, esAdmin }: { email: string; esAdmin: boolean }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [cargando, setCargando] = useState(false)
  const [verPass, setVerPass] = useState(false)

  const form = useForm<Valores>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', password: '', confirmPassword: '' },
  })

  const password = form.watch('password')
  const requisitos = [
    { label: '8+ caracteres', ok: password.length >= 8 },
    { label: 'Una mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Un número', ok: /[0-9]/.test(password) },
  ]

  async function onSubmit(values: Valores) {
    setCargando(true)
    const res = await llamarAccion(() => completarCuenta(values.nombre, values.password))
    if (!('ok' in res) || !res.ok) {
      const msg = 'error' in res ? res.error : 'Probá de nuevo en un momento.'
      toast.error('No pudimos completar tu cuenta', { description: msg })
      setCargando(false)
      return
    }
    // Cambiar la contraseña invalida la sesión abierta, así que sin esto la
    // persona termina en /login justo después de activar su cuenta. Se la vuelve
    // a entrar con la clave que acaba de elegir.
    const { error: errLogin } = await supabase.auth.signInWithPassword({
      email,
      password: values.password,
    })

    toast.success(`¡Listo, ${values.nombre.split(' ')[0]}!`, {
      description: errLogin
        ? 'Tu contraseña quedó cambiada. Ingresá con la nueva.'
        : 'Tu contraseña quedó cambiada. La provisoria ya no sirve.',
    })

    // Navegación dura y no router.push: hace falta un request nuevo para que el
    // middleware lea el perfil con el flag ya apagado y la cookie de la sesión
    // recién creada. Con la navegación del cliente se corría una carrera y la
    // persona se quedaba mirando esta misma pantalla.
    const destino = errLogin ? '/login' : esAdmin ? '/admin' : '/panel-de-control'
    setTimeout(() => { window.location.href = destino }, 1000)
  }

  return (
    <div className="min-h-svh bg-[#f7f9fb] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_16px_40px_-15px_rgba(0,33,63,0.15)] overflow-hidden">
          <div className="bg-[#00213f] px-8 py-7">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase text-white/50 mb-1">
              Primer ingreso
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
              Activá tu cuenta
            </h1>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              Entraste con una clave provisoria. Elegí una propia y decinos cómo te llamás
              para terminar.
            </p>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2.5 mb-6">
              <UserRound className="w-4 h-4 shrink-0 text-slate-400" />
              <span className="truncate">{email}</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#191c1e]">Nombre y apellido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: María Fernández"
                          className="bg-[#f2f4f6] focus:bg-white"
                          autoComplete="name"
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#191c1e]">Tu nueva contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={verPass ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="bg-[#f2f4f6] pr-10 focus:bg-white"
                            autoComplete="new-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setVerPass((v) => !v)}
                            aria-label={verPass ? 'Ocultar la contraseña' : 'Ver la contraseña'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                          >
                            {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        {requisitos.map((r) => (
                          <span
                            key={r.label}
                            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              r.ok ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            <Check className={`w-3 h-3 ${r.ok ? 'opacity-100' : 'opacity-30'}`} />
                            {r.label}
                          </span>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#191c1e]">Repetila</FormLabel>
                      <FormControl>
                        <Input
                          type={verPass ? 'text' : 'password'}
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
                  disabled={cargando}
                  className="w-full h-12 bg-[#00213f] hover:bg-[#10375c] text-white font-bold"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    'Entrar a UIAB Conecta'
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-[11px] text-slate-400 text-center mt-5 leading-relaxed">
              Cuando guardes, la clave provisoria que te pasaron deja de funcionar.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
