'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2 } from 'lucide-react'
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

// Form schema with Zod
const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
})

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParams = searchParams.get('redirect')
  
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Supabase client instance for browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true)

    try {
      // 1. Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        toast.error('Error de credenciales', {
          description: 'El correo electrónico o la contraseña son incorrectos.',
        })
        setIsLoading(false)
        return
      }

      // 2. Fetch role for Smart Redirection
      const { data: profile } = await supabase
        .from('perfiles')
        .select('rol_sistema')
        .eq('id', data.user.id)
        .single()

      toast.success('Acceso exitoso', {
        description: 'Redirigiendo a tu panel...',
      })

      // 3. Smart Redirect: Either to the intent redirect OR post-login default URL
      if (redirectParams) {
        router.push(redirectParams)
      } else {
        const rol = profile?.rol_sistema
        if (rol === 'admin') router.push('/admin')
        else if (rol === 'company') router.push('/dashboard') // UX requirement for companies
        else router.push('/dashboard') // Default path for others (providers, etc)
      }
      
      router.refresh()
    } catch (err: any) {
      toast.error('Error al iniciar sesión', {
        description: err.message || 'Credenciales inválidas.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      {/* Structural Industrial Design Backdrop */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900" />
      
      {/* Form Card */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-8 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
        
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Conectar <span className="text-primary-600">UIAB</span>
          </h1>
          <p className="text-sm text-slate-500">Ingresa las credenciales de tu organización</p>
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
                      placeholder="ejemplo@industria.com" 
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary-500" 
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-slate-700">Contraseña</FormLabel>
                    <Link 
                      href="/recovery" 
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:ring-primary-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Ingresar al Portal'}
            </Button>
          </form>
        </Form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          ¿Representas a una nueva industria?{' '}
          <Link href="/register" className="font-semibold text-primary-600 hover:underline transition-colors">
            Solicitar alta
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
