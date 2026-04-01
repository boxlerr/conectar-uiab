'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Building, Truck, Loader2, CheckCircle2 } from 'lucide-react'
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

const registerSchema = z.object({
  nombre: z.string().min(3, { message: 'Mínimo 3 caracteres requeridos' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
  role: z.enum(['empresa', 'proveedor'], {
    message: 'Debes seleccionar un tipo de cuenta'
  }),
})

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      role: undefined,
    },
  })

  // Supabase client instance
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true)

    try {
      // 1. Authenticate / Create Supabase Identity
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            nombre_completo: values.nombre,
          }
        }
      })

      if (authError || !authData.user) {
        toast.error('Error al registrarse', {
          description: authError?.message || 'Hubo un problema procesando tu cuenta.',
        })
        setIsLoading(false)
        return
      }

      // 2. Sync Custom Schema Tables (perfiles, empresas, miembros_empresa)
      const res = await fetch('/api/auth/register-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: authData.user.id,
          email: values.email,
          role: values.role,
          nombre: values.nombre,
        }),
      })

      if (!res.ok) {
        // Technically auth.users is created, but the public profile failed. 
        // We log it and tell the user, but they might be able to log in and face issues.
        // A rollback or webhook logic is superior, but this is a solid start.
        toast.error('Error de Creación', { description: 'Tuvimos un problema configurando tu entorno corporativo.' })
        setIsLoading(false)
        return
      }

      // Registration completely successful
      setIsSuccess(true)
      toast.success('¡Registro Exitoso!', {
        description: 'Hemos creado tu estructura corporativa inicial.',
      })
      
      // Auto redirect after a short celebration
      setTimeout(() => {
        router.push(values.role === 'empresa' ? '/directorio' : '/proveedor/proveedores')
        router.refresh()
      }, 2000)

    } catch (err) {
      toast.error('Error de Sistema', { description: 'Contacta a soporte técnico.' })
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900" />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Bienvenido a UIAB!</h2>
          <p className="text-slate-500">Estamos preparando tu nueva red de conectividad industrial.</p>
          <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-slate-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 py-12">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900" />
      
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-900/5 my-auto">
        
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Abre tu cuenta y conecta
          </h1>
          <p className="text-sm text-slate-500">
            Selecciona el tipo de entidad e ingresa tus datos.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Custom Role Selector */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-slate-700">Tipo de Cuenta</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        onClick={() => field.onChange('empresa')}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          field.value === 'empresa' 
                            ? 'border-primary-600 bg-primary-50 text-primary-900' 
                            : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        <Building className={`mx-auto h-6 w-6 mb-2 ${field.value === 'empresa' ? 'text-primary-600' : 'text-slate-400'}`} />
                        <span className="block text-sm font-semibold">Soy Empresa</span>
                      </div>
                      <div 
                        onClick={() => field.onChange('proveedor')}
                        className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                          field.value === 'proveedor' 
                            ? 'border-primary-600 bg-primary-50 text-primary-900' 
                            : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'
                        }`}
                      >
                        <Truck className={`mx-auto h-6 w-6 mb-2 ${field.value === 'proveedor' ? 'text-primary-600' : 'text-slate-400'}`} />
                        <span className="block text-sm font-semibold">Soy Proveedor</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Nombre / Razón Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Industrias SA" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Email Profesional</FormLabel>
                    <FormControl>
                      <Input placeholder="contacto@industria.com" className="bg-slate-50" {...field} />
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
                    <FormLabel className="text-slate-700">Contraseña Segura</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" className="bg-slate-50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white shadow-sm h-11"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
            </Button>
          </form>
        </Form>

        <div className="mt-8 text-center text-sm text-slate-500">
          ¿Ya ingresaste a UIAB antes?{' '}
          <Link href="/login" className="font-semibold text-primary-600 hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
