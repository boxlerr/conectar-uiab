'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'
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

export default function RecoveryPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof recoverySchema>>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  })

  // Supabase client instance
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
        toast.error('Error al solicitar recuperación', {
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast.success('Solicitud enviada', {
        description: 'Verifica tu bandeja de entrada en los próximos 2 minutos.',
      })
    } catch (err) {
      toast.error('Error de sistema', { description: 'Contacta al soporte técnico.' })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="absolute inset-0 z-0 bg-slate-900" />
      
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5">
        
        <Link href="/login" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 mb-6 transition-colors">
          <ArrowLeft className="mr-1 h-3 w-3" />
          Volver
        </Link>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <MailCheck className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Revisa tu correo</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Si el email <strong>{form.getValues().email}</strong> coincide con una cuenta activa, recibirás un enlace de reseteo en breve.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Recuperar Acceso
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                Ingresa el correo corporativo vinculado a tu organización y enviaremos las instrucciones de recuperación segura.
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Email Corporativo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="responsable@industria.com" 
                          className="bg-slate-50 focus:bg-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white h-11"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Envíame un Enlace Mágico'}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  )
}
