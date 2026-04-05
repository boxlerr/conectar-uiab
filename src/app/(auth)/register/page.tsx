'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Building2, 
  Truck, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  ChevronLeft, 
  ShieldCheck, 
  Zap, 
  Users,
  Briefcase,
  Target,
  Award,
  Globe,
  Lock,
  Mail,
  User,
  LayoutDashboard,
  Megaphone,
  Rocket,
  Shield,
  Eye,
  EyeOff,
  Check,
  Circle,
  XCircle
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
import { cn } from '@/lib/utils'

// ─── VALIDATION SCHEMA ───

const registerSchema = z.object({
  nombre: z.string().min(3, { message: 'Mínimo 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' }),
  confirmPassword: z.string(),
  role: z.enum(['company', 'provider'], {
    message: 'Selecciona una categoría'
  }),
  sector: z.string().optional(),
  specialty: z.string().optional(),
  experience: z.string().optional(),
  size: z.string().optional(),
  plan: z.string().default('basic')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterValues = z.infer<typeof registerSchema>

// ─── ANIMATION VARIANTS ───

const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
}

const itemFade = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

// ─── HELPERS ───

const getPasswordStrength = (pass: string) => {
  if (!pass) return 0
  let strength = 0
  if (pass.length >= 8) strength += 25
  if (/[A-Z]/.test(pass)) strength += 25
  if (/[0-9]/.test(pass)) strength += 25
  if (/[^A-Za-z0-9]/.test(pass)) strength += 25
  return strength
}

const getStrengthColor = (strength: number) => {
  if (strength <= 25) return "bg-red-400"
  if (strength <= 50) return "bg-orange-400"
  if (strength <= 75) return "bg-yellow-400"
  return "bg-primary-500"
}

// ─── COMPONENT ───

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      sector: '',
      specialty: '',
      experience: '',
      size: '',
      plan: 'basic'
    },
  })

  // Watch fields
  const selectedRole = form.watch('role')
  const password = form.watch('password')
  
  const passRequirements = useMemo(() => {
    return [
      { label: "Mínimo 8 caracteres", met: password.length >= 8 },
      { label: "Una mayúscula", met: /[A-Z]/.test(password) },
      { label: "Un número", met: /[0-9]/.test(password) },
      { label: "Carácter especial (!@#$)", met: /[^A-Za-z0-9]/.test(password) }
    ]
  }, [password])

  const passStrength = useMemo(() => getPasswordStrength(password), [password])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => { if (step > 1) setStep(prev => prev - 1) }

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
      toast.success('¡Acceso Creado con Éxito!')
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
    if (currentStep === 1) fieldsToValidate = ['role']
    else if (currentStep === 3) fieldsToValidate = ['nombre', 'email', 'password', 'confirmPassword']

    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      if (isValid) nextStep()
      else {
        const errors = form.formState.errors
        Object.values(errors).forEach(err => {
           if (err?.message) toast.warning(err.message as string)
        })
      }
    } else {
      nextStep()
    }
  }

  const checklistItems = useMemo(() => {
    if (selectedRole === 'company') {
      return [
        { icon: Globe, label: "Red Industrial", desc: "Directorio completo de socios UIAB." },
        { icon: LayoutDashboard, label: "Gestión Centralizada", desc: "Órdenes y cotizaciones eficientes." },
        { icon: ShieldCheck, label: "Proveedores Certificados", desc: "Expertos validados por la Unión." }
      ]
    }
    return [
      { icon: Megaphone, label: "Visibilidad Premium", desc: "Directo a los jefes de mantenimiento." },
      { icon: Target, label: "Oportunidades Reales", desc: "Recibe pedidos por rubro y afinidad." },
      { icon: Award, label: "Insignia de Trust", desc: "Sello de 'Socio Verificado 2026'." }
    ]
  }, [selectedRole])

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-[500px] w-full items-center justify-center p-6 py-20">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-sm bg-primary-100 mb-6 border border-primary-200">
            <CheckCircle2 className="h-10 w-10 text-primary-700" />
          </div>
          <h2 className="text-3xl font-black text-[#00213f] mb-4 tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>¡Perfil Creado!</h2>
          <p className="text-slate-500 mb-8 font-inter">Personalizando tu acceso al ecosistema industrial...</p>
          <div className="flex items-center justify-center gap-3">
             <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
             <span className="text-[10px] font-black tracking-widest text-primary-600 uppercase">Cargando Dashboard</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white font-sans selection:bg-primary-100">
      
      {/* ─── MAIN ONBOARDING CONTAINER ─── */}
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 min-h-[calc(100vh-140px)]">
        
        {/* SIDEBAR — INDUSTRIAL VALUES CHECKLIST */}
        <div className="relative hidden lg:flex flex-col justify-center p-12 lg:p-16 bg-[#00213f] text-white overflow-hidden">
          {/* Background Illustration Overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole || 'intro'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-0"
            >
              {(!selectedRole) && <Image src="/landing/hero-industrial.png" alt="Industrial" fill className="object-cover grayscale" priority />}
              {(selectedRole === 'company') && <Image src="/landing/hero-dashboard.png" alt="Analytics" fill className="object-cover" priority />}
              {(selectedRole === 'provider') && <Image src="/landing/trades-collage.png" alt="Trades" fill className="object-cover brightness-50" priority />}
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-[#00213f] via-[#00213f]/40 to-transparent z-0" />
          
          <div className="relative z-10 space-y-10 max-w-lg">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole || 'intro'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl lg:text-7xl font-black leading-[0.95] tracking-tighter mb-8" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                  {!selectedRole && "Arquitectura Industrial."}
                  {selectedRole === 'company' && "Gestión sin Límites."}
                  {selectedRole === 'provider' && "Tu Trabajo, en el Mapa."}
                </h1>
                
                <p className="text-white/40 text-lg leading-relaxed mb-12 font-inter max-w-sm">
                  Crea tu identidad digital para formar parte del ecosistema oficial de la Unión Industrial.
                </p>

                {selectedRole && (
                  <div className="space-y-4">
                    <p className="text-[11px] font-black tracking-widest uppercase text-primary-300/80 mb-6">Estás desbloqueando:</p>
                    {checklistItems.map((item, i) => (
                      <motion.div 
                        key={i}
                        variants={itemFade}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.1 * i }}
                        className="flex items-center gap-5 p-5 rounded-sm bg-white/5 backdrop-blur-xl border border-white/5"
                      >
                        <div className="h-10 w-10 flex items-center justify-center text-primary-100 rounded-sm bg-white/10 ring-1 ring-white/20">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-base leading-tight mb-0.5">{item.label}</h3>
                          <p className="text-white/30 text-xs leading-tight">{item.desc}</p>
                        </div>
                        <Check className="h-4 w-4 text-primary-400 opacity-50" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        {/* FORM CONTENT — PROFESSIONAL & POLISHED */}
        <div className="flex flex-col p-6 lg:p-14 justify-center items-center relative">
          
          {/* Internal Step Header */}
          <div className="absolute top-8 left-8 right-8 lg:left-14 lg:right-14 flex items-center justify-between">
             <div className="flex items-center gap-4">
                {step > 1 && (
                  <motion.button 
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    onClick={prevStep}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#00213f] hover:bg-slate-50 transition-all border border-slate-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>
                )}
                <div className="flex items-center gap-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={cn("h-1 rounded-full transition-all duration-500", step === i ? "w-8 bg-primary-600" : "w-2 bg-slate-100")} />
                   ))}
                </div>
             </div>
             <Badge className="bg-slate-50 text-slate-400 hover:bg-slate-50 border-none font-black text-[10px] tracking-widest uppercase px-3">Fase {step}</Badge>
          </div>

          <div className="w-full max-w-md mx-auto">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step} variants={pageTransition} initial="initial" animate="animate" exit="exit"
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                    
                    {/* PHASE 1: ROLE */}
                    {step === 1 && (
                      <div className="space-y-8 py-4">
                        <div className="space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 hover:bg-primary-50 font-black px-2.5 py-1 text-[10px] tracking-widest uppercase border-none rounded-[2px]">Onboarding 101</Badge>
                           <h2 className="text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Bienvenido.<br />Define tu rol.</h2>
                        </div>

                        <div className="grid gap-3">
                          <FormField control={form.control} name="role" render={({ field }) => (
                            <>
                              {[
                                { id: 'company', label: 'Soy Empresa', desc: 'Planta industrial o gerencial', icon: Building2 },
                                { id: 'provider', label: 'Soy Proveedor', desc: 'Especialista en servicios b2b', icon: Truck }
                              ].map(r => (
                                <div 
                                  key={r.id}
                                  onClick={() => field.onChange(r.id)}
                                  className={cn(
                                    "p-6 rounded-sm border-2 transition-all cursor-pointer flex items-center justify-between group h-24",
                                    field.value === r.id ? "bg-primary-50 border-primary-600 shadow-xl shadow-primary-900/5 ring-1 ring-primary-200" : "bg-white border-slate-100 hover:border-slate-200"
                                  )}
                                >
                                  <div className="flex items-center gap-5">
                                    <div className={cn("h-14 w-14 rounded-sm flex items-center justify-center transition-all", field.value === r.id ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100")}>
                                      <r.icon className="h-7 w-7" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-bold text-[#00213f] leading-none mb-1">{r.label}</h3>
                                      <p className="text-xs font-inter text-slate-500">{r.desc}</p>
                                    </div>
                                  </div>
                                  {field.value === r.id && <CheckCircle2 className="h-6 w-6 text-primary-600" />}
                                </div>
                              ))}
                              <FormMessage />
                            </>
                          )} />
                        </div>

                        <div className="space-y-4 pt-4">
                          <Button 
                            type="button" onClick={() => validateStep(1)} disabled={!selectedRole} 
                            className="w-full h-15 bg-[#00213f] hover:bg-black text-white font-black text-lg rounded-sm transition-all shadow-xl shadow-primary-900/10"
                          >
                            Continuar <ArrowRight className="ml-3 h-5 w-5" />
                          </Button>
                          <p className="text-center text-[11px] font-black uppercase tracking-widest text-slate-300">
                             ¿Ya tienes cuenta? <Link href="/login" className="text-primary-600 hover:text-primary-700 ml-2">Identifícate</Link>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* PHASE 2: VALUE */}
                    {step === 2 && (
                      <div className="space-y-8 py-4">
                        <div className="space-y-3">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Ecosistema</Badge>
                           <h2 className="text-5xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                              {selectedRole === 'company' ? "Tu red regional." : "Tu trabajo, visible."}
                           </h2>
                        </div>

                        <div className="relative aspect-video rounded-sm overflow-hidden shadow-2xl group border border-slate-100">
                           <Image 
                             src={selectedRole === 'company' ? "/landing/platform-preview.png" : "/landing/pro-tradesperson.png"} 
                             alt="Contexto" fill className="object-cover transition-transform duration-1000 group-hover:scale-105"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#00213f] via-transparent to-transparent flex items-end p-8">
                             <p className="text-white text-lg font-bold leading-tight max-w-[90%]">
                               {selectedRole === 'company' 
                                 ? "Acceso táctico a la mayor base de proveedores validados por la Unión Industrial." 
                                 : "Posicionamos tu empresa frente a los tomadores de decisiones de las fábricas locales."}
                             </p>
                           </div>
                        </div>

                        <Button type="button" onClick={nextStep} className="w-full h-15 bg-[#00213f] hover:bg-black text-white font-black text-lg rounded-sm transition-all">
                          Crear Identidad <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* PHASE 3: IDENTITY & CREDENTIALS */}
                    {step === 3 && (
                      <div className="space-y-8 py-4">
                        <div className="flex items-start justify-between">
                           <div className="space-y-2">
                              <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Configuración de ID</Badge>
                              <h2 className="text-5xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Identidad.</h2>
                              <p className="text-base text-slate-500 font-inter">Credenciales de acceso oficial b2b.</p>
                           </div>
                           <div className="h-14 w-14 rounded-sm border border-slate-100 bg-slate-50 flex flex-col items-center justify-center text-slate-300 shrink-0">
                              <Shield className="h-6 w-6 mb-1" />
                              <span className="text-[7px] font-black uppercase text-slate-400">Secure</span>
                           </div>
                        </div>

                        <div className="grid gap-4">
                          <FormField control={form.control} name="nombre" render={({ field }) => (
                            <FormItem className="space-y-1">
                               <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre / Razón Social</FormLabel>
                               <FormControl>
                                  <div className="relative group">
                                     <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                     <Input placeholder="Ej: Aceros Almirante SA" className="h-13 pl-11 rounded-sm bg-slate-50/50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] text-base" {...field} />
                                  </div>
                               </FormControl>
                               <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="space-y-1">
                               <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</FormLabel>
                               <FormControl>
                                  <div className="relative group">
                                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                     <Input placeholder="contacto@industria.com" className="h-13 pl-11 rounded-sm bg-slate-50/50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] text-base" {...field} />
                                  </div>
                               </FormControl>
                               <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />

                          <div className="grid gap-4 pt-2">
                             <FormField control={form.control} name="password" render={({ field }) => (
                               <FormItem className="space-y-1">
                                  <div className="flex items-center justify-between ml-1">
                                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</FormLabel>
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">
                                       {showPass ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                  </div>
                                  <FormControl>
                                     <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-13 pl-11 rounded-sm bg-slate-50/50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] text-base tracking-widest" {...field} />
                                     </div>
                                  </FormControl>
                                  
                                  {/* Strength Meter */}
                                  <div className="pt-2 px-1">
                                     <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                          <div key={i} className={cn("h-full flex-1 transition-all duration-500", passStrength >= i*25 ? getStrengthColor(passStrength) : "bg-slate-100")} />
                                        ))}
                                     </div>
                                  </div>

                                  {/* Real-time Requirements Checklist */}
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-3 px-1">
                                      {passRequirements.map((req, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                           {req.met ? (
                                             <CheckCircle2 className="h-3 w-3 text-primary-500 shrink-0" />
                                           ) : (
                                             <div className="h-3 w-3 rounded-full border border-slate-200 shrink-0" />
                                           )}
                                           <span className={cn("text-[9px] font-bold uppercase tracking-tight transition-colors", req.met ? "text-primary-700" : "text-slate-300")}>
                                              {req.label}
                                           </span>
                                        </div>
                                      ))}
                                  </div>
                                  <FormMessage className="text-[10px] font-bold" />
                               </FormItem>
                             )} />

                             <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                               <FormItem className="space-y-1">
                                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vuelva a escribir la contraseña</FormLabel>
                                  <FormControl>
                                     <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-13 pl-11 rounded-sm bg-slate-50/50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] text-base tracking-widest" {...field} />
                                     </div>
                                  </FormControl>
                                  <FormMessage className="text-[10px] font-bold" />
                               </FormItem>
                             )} />
                          </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-4">
                           <Button type="button" onClick={() => validateStep(3)} className="w-full h-15 bg-[#00213f] hover:bg-black text-white font-black text-lg rounded-sm active:scale-[0.98] transition-all">
                             Validar Credenciales <ArrowRight className="ml-3 h-5 w-5" />
                           </Button>
                           <div className="flex items-center gap-2 justify-center opacity-30">
                              <Lock className="h-3 w-3" />
                              <span className="text-[8px] font-black uppercase tracking-widest">Encriptación Industrial de Grado 4 (SSL)</span>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* PHASE 4: CATEGORIZATION */}
                    {step === 4 && (
                      <div className="space-y-8 py-4">
                        <div className="space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Especialización</Badge>
                           <h2 className="text-5xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Alcance.</h2>
                           <p className="text-lg text-slate-500 font-inter">Sector de actividad en el parque industrial.</p>
                        </div>

                        <div className="space-y-6">
                          {selectedRole === 'company' ? (
                            <>
                              <FormField control={form.control} name="sector" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sector Productivo</FormLabel>
                                  <FormControl>
                                    <select className="flex w-full h-13 rounded-sm border-none bg-slate-50/50 px-4 text-base font-bold text-[#00213f] focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer appearance-none" {...field}>
                                      <option value="">Elegir Sector</option>
                                      <option value="metal">Metalmecánica</option>
                                      <option value="quimica">Petroquímica / Química</option>
                                      <option value="alimento">Alimentaria & Bebidas</option>
                                      <option value="logistica">Logística & Depósitos</option>
                                    </select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="size" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Envergadura Operativa</FormLabel>
                                  <FormControl>
                                    <select className="flex w-full h-13 rounded-sm border-none bg-slate-50/50 px-4 text-base font-bold text-[#00213f] focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer appearance-none" {...field}>
                                      <option value="">Dotación Estimada</option>
                                      <option value="1">Micro (1-10)</option>
                                      <option value="2">Pequeña (11-50)</option>
                                      <option value="3">Mediana (51-200)</option>
                                      <option value="4">Grande (+200)</option>
                                    </select>
                                  </FormControl>
                                </FormItem>
                              )} />
                            </>
                          ) : (
                            <>
                              <FormField control={form.control} name="specialty" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Eje de Servicio</FormLabel>
                                  <FormControl>
                                    <select className="flex w-full h-13 rounded-sm border-none bg-slate-50/50 px-4 text-base font-bold text-[#00213f] focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer appearance-none" {...field}>
                                      <option value="">Elegir Rama</option>
                                      <option value="elect">Mante. Eléctrico Industrial</option>
                                      <option value="meca">Montaje & Mecánica de Precisión</option>
                                      <option value="seg">Higiene & Seg. Industrial</option>
                                      <option value="obra">Obra Civil & Montajes</option>
                                    </select>
                                  </FormControl>
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="experience" render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Años en el Sector</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                       <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600 transition-colors" />
                                       <Input type="number" placeholder="Trayectoria" className="h-13 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] text-base" {...field} />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )} />
                            </>
                          )}
                        </div>

                        <Button type="button" onClick={nextStep} className="w-full h-15 bg-[#00213f] hover:bg-black text-white font-black text-lg rounded-sm active:scale-[0.98] transition-all">
                          Ver Membresías Oficiales <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* PHASE 5: PLANS */}
                    {step === 5 && (
                      <div className="space-y-8 py-2">
                        <div className="space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Membresías b2b</Badge>
                           <h2 className="text-4xl lg:text-5xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Suscripción.</h2>
                           <p className="text-base text-slate-500 font-inter">Niveles de presencia en el directorio oficial.</p>
                        </div>

                        <FormField control={form.control} name="plan" render={({ field }) => (
                          <div className="grid gap-3">
                            <div 
                               onClick={() => field.onChange('basic')} 
                               className={cn(
                                 "p-5 rounded-sm border-2 transition-all cursor-pointer flex items-center justify-between",
                                 field.value === 'basic' ? "bg-slate-50 border-slate-300 shadow-sm ring-1 ring-slate-100" : "bg-white border-slate-100 hover:border-slate-200"
                               )}
                            >
                               <div className="flex items-center gap-4">
                                  <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all", field.value === 'basic' ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200 bg-white")}>
                                     {field.value === 'basic' && <Check className="h-3 w-3" />}
                                  </div>
                                  <div>
                                     <h3 className="font-bold text-[#00213f] text-sm lg:text-base leading-none">Perfil Gratuito</h3>
                                     <p className="text-[10px] text-slate-400 font-inter mt-1">Presencia pasiva en el listado b2b</p>
                                  </div>
                               </div>
                               <span className="text-[11px] font-black tracking-widest text-[#00213f] uppercase">Socio</span>
                            </div>

                            <div 
                               onClick={() => field.onChange('premium')} 
                               className={cn(
                                 "relative p-6 lg:p-7 rounded-sm border-2 transition-all cursor-pointer shadow-2xl",
                                 field.value === 'premium' ? "bg-primary-50 border-primary-600 ring-1 ring-primary-200" : "bg-white border-slate-100 hover:border-slate-200"
                               )}
                            >
                               <div className="flex flex-col gap-6">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-primary-600 rounded-sm flex items-center justify-center text-white shadow-xl">
                                           <Rocket className="h-6 w-6" />
                                        </div>
                                        <div>
                                           <h3 className="text-xl font-bold text-[#00213f]">Suscripción Pro</h3>
                                           <p className="text-[10px] font-black text-primary-600/60 uppercase tracking-[0.2em] leading-none mt-1">Socio Verificado 2026</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-2xl font-black text-[#00213f] leading-none tracking-tighter">$25.000</p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">/ mes</p>
                                     </div>
                                  </div>

                                  <div className="space-y-2 py-4 border-y border-primary-200/40">
                                     {[
                                       selectedRole === 'company' ? 'Filtros avanzados por trayectoria b2b' : 'Sello "Socio Verificado" en el perfil',
                                       selectedRole === 'company' ? 'Acceso a legajos de ART y Seguros' : 'Posicionamiento prioritario en búsquedas',
                                       'Soporte técnico directo vía WhatsApp',
                                       'Métricas de tráfico e interés industrial'
                                     ].map((b, i) => (
                                       <div key={i} className="flex items-center gap-2.5 text-[11px] lg:text-[13px] font-bold text-[#00213f]/70">
                                          <div className="h-1.5 w-1.5 bg-primary-600 rounded-full" />
                                          {b}
                                       </div>
                                     ))}
                                  </div>
                               </div>
                               <Badge className="absolute -top-3 left-8 bg-primary-600 px-4 h-7 text-[10px] font-black tracking-widest uppercase border-none">Oficial</Badge>
                            </div>
                          </div>
                        )} />

                        <div className="space-y-4 pt-6">
                          <Button 
                            type="submit" disabled={isLoading} 
                            className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white font-black text-xl rounded-sm shadow-2xl transition-all active:scale-[0.98]"
                          >
                            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar Registro Oficial'}
                          </Button>
                          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-xs mx-auto">
                            Ingresas formalmente al entorno digital de la Unión Industrial.
                          </p>
                        </div>
                      </div>
                    )}

                  </form>
                </Form>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
