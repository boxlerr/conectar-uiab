'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Building, 
  Truck, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  Factory, 
  ShieldCheck, 
  Zap, 
  Users,
  Briefcase,
  Award,
  TrendingUp,
  Rocket
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
import { Badge } from '@/components/ui/badge'

// ─── VALIDATION SCHEMA ───

const registerSchema = z.object({
  nombre: z.string().min(3, { message: 'Mínimo 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' }),
  role: z.enum(['company', 'provider'], {
    message: 'Selecciona una categoría'
  }),
  sector: z.string().optional(),
  specialty: z.string().optional(),
  experience: z.string().optional(),
  size: z.string().optional(),
  plan: z.string().default('basic')
})

type RegisterValues = z.infer<typeof registerSchema>

// ─── ANIMATION VARIANTS ───

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      role: undefined,
      sector: '',
      specialty: '',
      experience: '',
      size: '',
      plan: 'basic'
    },
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  const selectedRole = form.watch('role')

  async function onSubmit(values: RegisterValues) {
    setIsLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { nombre_completo: values.nombre }
        }
      })

      if (authError || !authData.user) {
        toast.error('Error al registrarse', { description: authError?.message })
        setIsLoading(false)
        return
      }

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
        toast.error('Error de Perfil', { description: 'No pudimos sincronizar tus datos.' })
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast.success('¡Registro Completado!')
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2500)
    } catch (err) {
      toast.error('Error de Sistema')
      setIsLoading(false)
    }
  }

  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof RegisterValues)[] = []
    if (currentStep === 2) fieldsToValidate = ['role']
    else if (currentStep === 3) fieldsToValidate = ['nombre', 'email', 'password']

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      if (isValid) nextStep()
      else toast.warning("Completa los campos requeridos")
    } else {
      nextStep()
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-12 text-center shadow-2xl">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 mb-8 border border-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Bienvenido!</h2>
          <p className="text-slate-600 mb-8">Estamos preparando tu nueva red de conectividad industrial.</p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-200" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#001222] p-4 lg:p-8 overflow-hidden font-sans selection:bg-primary-200">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-700/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[700px]">
        
        {/* SIDEBAR LOGIC */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#00213f] to-[#0c2d4a] text-white overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-16">
              <div className="h-8 w-8 rounded-lg bg-primary-500 flex items-center justify-center font-black text-lg shadow-lg shadow-primary-500/20">U</div>
              <span className="text-xl font-bold tracking-tight">UIAB CONECTAR</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="space-y-8">
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-4xl font-bold leading-tight">El ecosistema que tu planta industrial necesita.</h2>
                    <p className="text-primary-100/60 text-lg leading-relaxed">Conectamos empresas del parque Industrial con proveedores locales verificados.</p>
                    <div className="space-y-4">
                      {[{ icon: Users, text: '+100 Empresas Activas' }, { icon: ShieldCheck, text: 'Proveedores Calificados' }, { icon: Zap, text: 'Oportunidades B2B' }].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-primary-300" />
                          <span className="text-sm font-medium">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-4xl font-bold leading-tight">Define tu rol en la red.</h2>
                    <p className="text-primary-100/60 text-lg leading-relaxed">Personalizamos tu experiencia para que encuentres exactamente lo que buscas.</p>
                  </div>
                )}
                {step >= 3 && (
                  <div className="space-y-6">
                    <h2 className="text-4xl font-bold leading-tight">Seguridad en cada paso.</h2>
                    <p className="text-primary-100/60 text-lg leading-relaxed">Tus datos están protegidos bajo estándares internacionales de seguridad.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="z-10 text-xs text-primary-300/40">© 2026 Unión Industrial de Almirante Brown</p>
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        {/* COMPONENT STEPS */}
        <div className="flex flex-col bg-white p-8 lg:p-14 overflow-y-auto">
          <div className="mb-10 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-primary-600' : 'bg-slate-100'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} variants={fadeSlide} initial="initial" animate="animate" exit="exit" className="flex-1 flex flex-col">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex-1 flex flex-col">
                  
                  {step === 1 && (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Bienvenido.</h1>
                        <p className="text-slate-500">Únete a la red industrial de confianza.</p>
                      </div>
                      <div className="grid gap-4">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
                          <Factory className="h-6 w-6 text-primary-600 mt-1" />
                          <div>
                            <p className="font-bold text-slate-900">Industrias</p>
                            <p className="text-sm text-slate-500">Publica necesidades y encuentra proveedores expertos.</p>
                          </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4 items-start">
                          <Wrench className="h-6 w-6 text-primary-600 mt-1" />
                          <div>
                            <p className="font-bold text-slate-900">Proveedores</p>
                            <p className="text-sm text-slate-500">Lleva tu servicio a las mejores fábricas del parque.</p>
                          </div>
                        </div>
                      </div>
                      <Button type="button" onClick={nextStep} className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg shadow-xl shadow-primary-600/20 active:scale-[0.98] transition-all">
                        Comenzar Onboarding <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      <p className="text-center text-sm text-slate-400">¿Ya tienes cuenta? <Link href="/login" className="text-primary-600 font-bold hover:underline">Inicia Sesión</Link></p>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8">
                      <Button variant="ghost" size="sm" onClick={prevStep} className="p-0 h-auto hover:bg-transparent text-slate-400 font-bold text-xs"><ChevronLeft className="h-3 w-3 mr-1" /> VOLVER</Button>
                      <h1 className="text-3xl font-extrabold text-slate-900">¿Qué tipo de cuenta prefieres?</h1>
                      <FormField control={form.control} name="role" render={({ field }) => (
                        <div className="grid gap-4">
                          <div onClick={() => field.onChange('company')} className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${field.value === 'company' ? 'border-primary-600 bg-primary-50 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-slate-200'}`}>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${field.value === 'company' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Building className="h-6 w-6" /></div>
                            <div><p className="font-bold text-slate-900">Soy Empresa</p><p className="text-xs text-slate-500">Planta industrial o PYME</p></div>
                            {field.value === 'company' && <CheckCircle2 className="ml-auto h-5 w-5 text-primary-600" />}
                          </div>
                          <div onClick={() => field.onChange('provider')} className={`cursor-pointer p-6 rounded-2xl border-2 transition-all flex items-center gap-5 ${field.value === 'provider' ? 'border-primary-600 bg-primary-50 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-slate-200'}`}>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${field.value === 'provider' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}><Truck className="h-6 w-6" /></div>
                            <div><p className="font-bold text-slate-900">Soy Proveedor</p><p className="text-xs text-slate-500">Servicios o mantenimientos</p></div>
                            {field.value === 'provider' && <CheckCircle2 className="ml-auto h-5 w-5 text-primary-600" />}
                          </div>
                          <FormMessage />
                        </div>
                      )} />
                      <Button type="button" onClick={() => validateStep(2)} disabled={!selectedRole} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg mt-auto">Continuar</Button>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6">
                      <Button variant="ghost" size="sm" onClick={prevStep} className="p-0 h-auto hover:bg-transparent text-slate-400 font-bold text-xs"><ChevronLeft className="h-3 w-3 mr-1" /> VOLVER</Button>
                      <h1 className="text-3xl font-extrabold text-slate-900">Datos de acceso.</h1>
                      <div className="space-y-4">
                        <FormField control={form.control} name="nombre" render={({ field }) => (
                          <FormItem><FormLabel className="font-bold text-slate-700">Nombre / Razón Social</FormLabel><FormControl><Input placeholder="Industrias SA" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel className="font-bold text-slate-700">Email Profesional</FormLabel><FormControl><Input placeholder="contacto@empresa.com" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="password" render={({ field }) => (
                          <FormItem><FormLabel className="font-bold text-slate-700">Contraseña Segura</FormLabel><FormControl><Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <Button type="button" onClick={() => validateStep(3)} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold">Configurar Perfil</Button>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6">
                      <Button variant="ghost" size="sm" onClick={prevStep} className="p-0 h-auto hover:bg-transparent text-slate-400 font-bold text-xs"><ChevronLeft className="h-3 w-3 mr-1" /> VOLVER</Button>
                      <h1 className="text-3xl font-extrabold text-slate-900">Información adicional.</h1>
                      <div className="space-y-4">
                        {selectedRole === 'company' ? (
                          <>
                            <FormField control={form.control} name="sector" render={({ field }) => (
                              <FormItem><FormLabel className="font-bold text-slate-700">Dinos qué haces</FormLabel><FormControl><select className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium" {...field}><option value="">Selecciona un sector</option><option value="metal">Metalúrgica</option><option value="quimica">Química</option><option value="logistica">Logística</option></select></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="size" render={({ field }) => (
                              <FormItem><FormLabel className="font-bold text-slate-700">Dotación</FormLabel><FormControl><select className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium" {...field}><option value="">Cantidad de empleados</option><option value="1">1-50</option><option value="2">51-200</option><option value="3">+200</option></select></FormControl></FormItem>
                            )} />
                          </>
                        ) : (
                          <>
                            <FormField control={form.control} name="specialty" render={({ field }) => (
                              <FormItem><FormLabel className="font-bold text-slate-700">Especialidad</FormLabel><FormControl><select className="flex w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium" {...field}><option value="">¿A qué te dedicas?</option><option value="elect">Electricista</option><option value="manten">Mantenimiento</option><option value="seg">Seguridad</option></select></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="experience" render={({ field }) => (
                              <FormItem><FormLabel className="font-bold text-slate-700">Años de experiencia</FormLabel><FormControl><Input type="number" className="h-12 rounded-xl bg-slate-50" {...field} /></FormControl></FormItem>
                            )} />
                          </>
                        )}
                      </div>
                      <Button type="button" onClick={nextStep} className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold">Ver Planes de Membresía</Button>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-8">
                      <Button variant="ghost" size="sm" onClick={prevStep} className="p-0 h-auto hover:bg-transparent text-slate-400 font-bold text-xs"><ChevronLeft className="h-3 w-3 mr-1" /> VOLVER</Button>
                      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Elige tu plan.</h1>
                      <FormField control={form.control} name="plan" render={({ field }) => (
                        <div className="grid gap-4">
                          <div onClick={() => field.onChange('basic')} className={`p-6 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${field.value === 'basic' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}>
                            <div className="flex gap-4 items-center">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><CheckCircle2 className="h-5 w-5" /></div>
                              <div><p className="font-bold text-slate-900">Plan Básico</p><p className="text-xs text-slate-500">Visibilidad estándar</p></div>
                            </div>
                            <span className="font-black text-slate-900">GRATIS</span>
                          </div>
                          <div onClick={() => field.onChange('premium')} className={`relative p-6 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${field.value === 'premium' ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:border-slate-200 shadow-lg shadow-black/5'}`}>
                            <div className="flex gap-4 items-center">
                              <div className="h-10 w-10 rounded-full bg-amber-400 flex items-center justify-center text-white"><Rocket className="h-5 w-5" /></div>
                              <div><p className="font-bold text-slate-900">Plan Profesional</p><p className="text-xs text-slate-500">Perfil destacado + Lead Priority</p></div>
                            </div>
                            <span className="font-black text-slate-900">$25.000<span className="text-[10px] text-slate-400">/mes</span></span>
                            <Badge className="absolute -top-3 -right-2 bg-amber-500 hover:bg-amber-600">MAS POPULAR</Badge>
                          </div>
                        </div>
                      )} />
                      <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-black text-lg shadow-xl shadow-primary-600/20">
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar Registro'}
                      </Button>
                      <p className="text-center text-[10px] text-slate-400">Al confirmar, aceptas nuestros Términos y Condiciones industriales.</p>
                    </div>
                  )}

                </form>
              </Form>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Wrench(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" > <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> </svg>
  )
}
