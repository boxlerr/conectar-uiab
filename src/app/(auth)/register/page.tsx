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
  Search,
  Factory,
  Settings2,
  HardHat,
  Stethoscope,
  PenTool,
  TruckIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'

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

// ─── OFFICIAL TAXONOMY ───

const SECTORS = {
  company: [
    { id: 'metal', label: 'Metalmecánica y Metalurgia', sub: ['Tornería y CNC', 'Soldadura Industrial', 'Fundición', 'Corte Láser/Plasma', 'Matricería'] },
    { id: 'quimica', label: 'Química y Petroquímica', sub: ['Productos Químicos', 'Pinturas', 'Lubricantes', 'Gases Industriales', 'Plásticos/Polímeros'] },
    { id: 'alimentos', label: 'Alimentaria y Agroindustria', sub: ['Frigoríficos', 'Lácteos', 'Panificación Industrial', 'Envasado y Conservas', 'Bebidas'] },
    { id: 'textil', label: 'Textil e Indumentaria', sub: ['Tejidos y Hilados', 'Indumentaria Laboral/EPP', 'Calzado Industrial', 'Bordado/Estampado'] },
    { id: 'construccion', label: 'Construcción y Materiales', sub: ['Hormigón/Viguetas', 'Aberturas Industriales', 'Obras de Planta', 'Sanitaria Industrial'] },
    { id: 'plasticos', label: 'Plásticos y Envases', sub: ['Inyección y Soplado', 'Packaging Industrial', 'Caucho y Gomas', 'Fibra de Vidrio'] },
    { id: 'madera', label: 'Madera y Papel', sub: ['Aserradero', 'Muebles Industriales', 'Cartón y Embalaje', 'Carpintería Industrial'] },
    { id: 'tech', label: 'Tecnología y Electrónica', sub: ['Automatización Industrial', 'Instrumentación', 'Telecomunicaciones', 'Software Industrial'] },
    { id: 'auto', label: 'Automotriz y Autopartes', sub: ['Fabricación de Piezas', 'Carrocería Especial', 'Rectificación', 'Mecánica Pesada'] },
    { id: 'logistica', label: 'Logística y Almacenamiento', sub: ['Transporte de Carga', 'Depósitos/3PL', 'Grúas y Elevación', 'Mudanzas Industriales'] },
  ],
  provider: [
    { id: 'mante', label: 'Mantenimiento Industrial', sub: ['Mecánica Industrial', 'Electricidad Industrial', 'Instrumental/PLC', 'Hidráulica y Neumática'] },
    { id: 'energy', label: 'Energía y Utilities', sub: ['Montajes Eléctricos', 'Instalaciones de Gas', 'Grupos Electrógenos', 'Tratamiento de Efluentes'] },
    { id: 'facilities', label: 'Servicios de Planta (Facilities)', sub: ['Limpieza Industrial', 'Seguridad y Vigilancia', 'Gestión de Residuos', 'Catering/Comedores'] },
    { id: 'insumos', label: 'Insumos y Herramientas', sub: ['Rodamientos/Transmisión', 'E.P.P. (Seguridad)', 'Herramientas Neumáticas', 'Consumibles Soldadura'] },
    { id: 'salud', label: 'Seguridad e Higiene / Salud', sub: ['Medicina Laboral', 'Consultoría H&S', 'Capacitación en Planta', 'Extintores/Emergencias'] },
    { id: 'prof', label: 'Servicios Profesionales', sub: ['Ingeniería y Proyectos', 'Normas ISO/Certificaciones', 'RRHH Industrial', 'Gestión Ambiental'] },
    { id: 'agro', label: 'Agropecuario (Servicios)', sub: ['Maquinaria Agrícola', 'Insumos Rurales', 'Infraestructura de Silos', 'Riego Industrial'] },
    { id: 'ceramica', label: 'Minerales y Cerámica', sub: ['Refractarios/Aislantes', 'Vidrio Industrial', 'Cal y Cemento Especial'] },
    { id: 'farma', label: 'Farma y Cosmética', sub: ['Laboratorio Industrial', 'Instalaciones Médicas', 'Insumos Hospitalarios'] },
    { id: 'grafica', label: 'Gráfica y Señalética', sub: ['Cartelería Industrial', 'Impresión Gran Formato', 'Branding de Plantas'] },
  ]
}

// ─── VALIDATION SCHEMA ───

const registerSchema = z.object({
  nombre: z.string().min(3, { message: 'Mínimo 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' }),
  confirmPassword: z.string(),
  role: z.enum(['company', 'provider'], {
    message: 'Selecciona una categoría'
  }),
  sectorId: z.string().min(1, { message: 'Selecciona un rubro industrial' }),
  subSector: z.string().min(1, { message: 'Selecciona una especialidad' }),
  experience: z.string().optional(),
  size: z.string().optional(),
  plan: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

type RegisterValues = z.infer<typeof registerSchema>

// ─── ANIMATION VARIANTS ───

const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
}

const itemFade: Variants = {
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
      role: 'company',
      sectorId: '',
      subSector: '',
      experience: '',
      size: '',
      plan: 'basic'
    },
  })

  // Watch fields
  const selectedRole = form.watch('role')
  const password = form.watch('password')
  const sectorId = form.watch('sectorId')
  
  const passRequirements = useMemo(() => {
    return [
      { label: "8+ Caracteres", met: password.length >= 8 },
      { label: "Mayúscula", met: /[A-Z]/.test(password) },
      { label: "Número", met: /[0-9]/.test(password) },
      { label: "Esp. (@#$)", met: /[^A-Za-z0-9]/.test(password) }
    ]
  }, [password])

  const passStrength = useMemo(() => getPasswordStrength(password), [password])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => { if (step > 1) setStep(prev => prev - 1) }

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        validateStep(step);
      }
    }
  }

  async function onSubmit(values: RegisterValues) {
    if (step < 5) {
      validateStep(step);
      return;
    }
    
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
          metadata: {
            sector: values.sectorId,
            subsector: values.subSector,
            size: values.size,
            experience: values.experience
          }
        }),
      })

      if (!res.ok) {
        toast.error('Error de Perfil', { description: 'No pudimos sincronizar tus datos.' })
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      toast.success('¡Registro Exitoso!')
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
    else if (currentStep === 4) fieldsToValidate = ['sectorId', 'subSector']

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
        { icon: Globe, label: "Red Industrial b2b", desc: "El directorio oficial del Parque." },
        { icon: LayoutDashboard, label: "Tablero Central", desc: "Gestión de pedidos y cotizaciones." },
        { icon: ShieldCheck, label: "Auditores UIAB", desc: "Socio validado por la administración." }
      ]
    }
    return [
      { icon: Megaphone, label: "Display Premium", desc: "Tu perfil en el top del buscador." },
      { icon: Target, label: "Match de Rubro", desc: "Puntos de contacto con industrias." },
      { icon: Award, label: "Certificación 2026", desc: "Sello oficial de Proveedor de Confianza." }
    ]
  }, [selectedRole])

  const selectedSectorData = useMemo(() => {
    if (!selectedRole || !sectorId) return null;
    return SECTORS[selectedRole].find(s => s.id === sectorId);
  }, [selectedRole, sectorId]);

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-[600px] w-full items-center justify-center p-6">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-sm bg-primary-100 mb-6 border border-primary-200 shadow-xl shadow-primary-900/5">
            <CheckCircle2 className="h-10 w-10 text-primary-700" />
          </div>
          <h2 className="text-4xl font-black text-[#00213f] mb-4 tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>¡Perfil Activo!</h2>
          <p className="text-slate-500 mb-8 font-inter">Preparando tu acceso al portal digital...</p>
          <div className="flex items-center justify-center gap-3">
             <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
             <span className="text-[10px] font-black tracking-widest text-primary-600 uppercase">Dashboard Link</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full bg-white font-sans selection:bg-primary-100" onKeyDown={handleKeyDown}>
      
      <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 min-h-[calc(100vh-140px)]">
        
        {/* SIDEBAR — EDITORIAL VALUES */}
        <div className="relative hidden lg:flex flex-col justify-center p-12 lg:p-16 bg-[#00213f] text-white overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRole || 'intro'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 1 }}
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tighter mb-8" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                  {!selectedRole && "Ecosistema Oficial."}
                  {selectedRole === 'company' && "Control Industrial."}
                  {selectedRole === 'provider' && "Tu Marca, Visible."}
                </h1>
                
                <p className="text-white/40 text-lg leading-relaxed mb-12 font-inter max-w-sm">
                  Damos forma a la comunicación digital de la Unión Industrial para potenciar el crecimiento regional.
                </p>

                {selectedRole && (
                  <div className="space-y-4">
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
                        <CheckCircle2 className="h-4 w-4 text-primary-400 opacity-50" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        {/* FORM CONTENT */}
        <div className="flex flex-col p-6 lg:p-14 justify-center items-center relative">
          
          <div className="absolute top-8 left-8 right-8 lg:left-14 lg:right-14 flex items-center justify-between">
             <div className="flex items-center gap-4">
                {step > 1 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={prevStep}
                    className="h-10 w-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#00213f] hover:bg-slate-50 transition-all border border-slate-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>
                )}
                <div className="flex items-center gap-1.5">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", step === i ? "w-10 bg-primary-600" : "w-1.5 bg-slate-100")} />
                   ))}
                </div>
             </div>
             <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] tracking-widest uppercase px-3 rounded-[2px]">FASE 0{step}</Badge>
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
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Start Engine</Badge>
                           <h2 className="text-5xl lg:text-7xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Define.<br />Tu Rol.</h2>
                        </div>

                        <div className="grid gap-3">
                          <FormField control={form.control} name="role" render={({ field }) => (
                            <>
                              {[
                                { id: 'company', label: 'Soy Empresa', desc: 'Planta industrial o gerencial', icon: Factory },
                                { id: 'provider', label: 'Soy Proveedor', desc: 'Especialista en servicios b2b', icon: Settings2 }
                              ].map(r => (
                                <div 
                                  key={r.id} onClick={() => field.onChange(r.id)}
                                  className={cn(
                                    "p-6 rounded-sm border-2 transition-all cursor-pointer flex items-center justify-between group h-24",
                                    field.value === r.id ? "bg-primary-50 border-primary-600 shadow-xl ring-1 ring-primary-200" : "bg-white border-slate-100 hover:border-slate-200"
                                  )}
                                >
                                  <div className="flex items-center gap-5">
                                    <div className={cn("h-14 w-14 rounded-sm flex items-center justify-center transition-all", field.value === r.id ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100")}>
                                      <r.icon className="h-7 w-7" />
                                    </div>
                                    <div>
                                      <h3 className="text-xl font-bold text-[#00213f] leading-none mb-1">{r.label}</h3>
                                      <p className="text-xs font-inter text-slate-500">{r.desc}</p>
                                    </div>
                                  </div>
                                  <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center", field.value === r.id ? "border-primary-600 bg-primary-600 text-white shadow-lg" : "border-slate-100")}>
                                    {field.value === r.id && <Check className="h-3 w-3" />}
                                  </div>
                                </div>
                              ))}
                              <FormMessage />
                            </>
                          )} />
                        </div>

                        <Button 
                          type="button" onClick={() => validateStep(1)} disabled={!selectedRole} 
                          className="w-full h-16 bg-[#00213f] hover:bg-black text-white font-black text-xl rounded-sm transition-all shadow-xl shadow-primary-900/10"
                        >
                          Continuar <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* PHASE 2: VALUE */}
                    {step === 2 && (
                      <div className="space-y-8 py-4 text-center">
                         <div className="space-y-4">
                            <h2 className="text-5xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                               {selectedRole === 'company' ? "Tu red regional." : "Tu trabajo, visible."}
                            </h2>
                            <p className="text-lg text-slate-500 max-w-sm mx-auto">
                               {selectedRole === 'company' 
                                 ? "Acceso táctico a la mayor base de proveedores validados por la Unión Industrial." 
                                 : "Posicionamos tu empresa frente a los tomadores de decisiones de las fábricas locales."}
                            </p>
                         </div>

                        <div className="relative aspect-video rounded-sm overflow-hidden shadow-2xl border border-slate-100">
                           <Image 
                             src={selectedRole === 'company' ? "/landing/platform-preview.png" : "/landing/pro-tradesperson.png"} 
                             alt="Contexto" fill className="object-cover"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-[#00213f]/80 via-transparent to-transparent flex items-end p-6">
                              <Badge className="bg-primary-600 border-none font-bold text-[10px] tracking-widest uppercase rounded-[2px]">UIAB Conecta v1.0</Badge>
                           </div>
                        </div>

                        <Button type="button" onClick={nextStep} className="w-full h-16 bg-[#00213f] hover:bg-black text-white font-black text-xl rounded-sm transition-all">
                          Crear Identidad <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* PHASE 3: IDENTITY */}
                    {step === 3 && (
                      <div className="space-y-8 py-4">
                        <div className="flex items-start justify-between">
                           <div className="space-y-2">
                              <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">ID Creation</Badge>
                              <h2 className="text-6xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Acceso.</h2>
                           </div>
                           <Shield className="h-10 w-10 text-slate-100" />
                        </div>

                        <div className="grid gap-4">
                          <FormField control={form.control} name="nombre" render={({ field }) => (
                            <FormItem className="space-y-1">
                               <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nombre / Razón Social</FormLabel>
                               <FormControl>
                                  <div className="relative group">
                                     <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600" />
                                     <Input placeholder="Ej: Vaxler Software SA" className="h-14 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f]" {...field} />
                                  </div>
                               </FormControl>
                               <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />

                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem className="space-y-1">
                               <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Corporativo</FormLabel>
                               <FormControl>
                                  <div className="relative group">
                                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600" />
                                     <Input placeholder="admin@vaxler.com" className="h-14 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f]" {...field} />
                                  </div>
                               </FormControl>
                               <FormMessage className="text-[10px] font-bold" />
                            </FormItem>
                          )} />

                          <div className="grid gap-4 pt-2">
                             <FormField control={form.control} name="password" render={({ field }) => (
                               <FormItem className="space-y-1">
                                  <div className="flex items-center justify-between ml-1">
                                    <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Contraseña</FormLabel>
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-[10px] font-bold text-primary-600 uppercase">
                                       {showPass ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                  </div>
                                  <FormControl>
                                     <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-14 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] tracking-widest" {...field} />
                                     </div>
                                  </FormControl>
                                  
                                  <div className="pt-3 px-1">
                                     <div className="h-1.5 w-full bg-slate-100 rounded-full flex gap-1">
                                        {[1, 2, 3, 4].map((i) => (
                                          <div key={i} className={cn("h-full flex-1 transition-all duration-500 rounded-full", passStrength >= i*25 ? getStrengthColor(passStrength) : "bg-slate-100")} />
                                        ))}
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 pt-4">
                                        {passRequirements.map((req, i) => (
                                          <div key={i} className="flex items-center gap-2">
                                             <div className={cn("h-3 w-3 rounded-full flex items-center justify-center transition-all", req.met ? "bg-primary-500 text-white" : "border border-slate-200")}>
                                                {req.met && <Check className="h-2 w-2" />}
                                             </div>
                                             <span className={cn("text-[9px] font-bold uppercase", req.met ? "text-primary-700" : "text-slate-300")}>{req.label}</span>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                                  <FormMessage className="text-[10px] font-bold" />
                               </FormItem>
                             )} />

                             <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                               <FormItem className="space-y-1">
                                  <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Repetir Contraseña</FormLabel>
                                  <FormControl>
                                     <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary-600" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-14 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f] tracking-widest" {...field} />
                                     </div>
                                  </FormControl>
                                  <FormMessage className="text-[10px] font-bold" />
                               </FormItem>
                             )} />
                          </div>
                        </div>

                        <Button type="button" onClick={() => validateStep(3)} className="w-full h-16 bg-[#00213f] hover:bg-black text-white font-black text-xl rounded-sm transition-all shadow-xl shadow-primary-900/10">
                           Siguiente Fase <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ✨ PHASE 4: OFFICIAL TAXONOMY — "ALCANCE" ✨ */}
                    {step === 4 && (
                      <div className="space-y-8 py-4">
                        <div className="space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Especialización b2b</Badge>
                           <h2 className="text-6xl font-black text-[#00213f] tracking-tighter leading-tight" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Alcance.</h2>
                           <p className="text-base text-slate-500 font-inter">Selecciona tu rubro y especialidad principal.</p>
                        </div>

                        <div className="grid gap-6">
                           <FormField control={form.control} name="sectorId" render={({ field }) => (
                             <FormItem className="space-y-1.5">
                               <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Rubro Industrial (Padre)</FormLabel>
                               <FormControl>
                                 <select 
                                   className="flex w-full h-14 rounded-sm border-none bg-slate-50 px-4 text-base font-bold text-[#00213f] focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer appearance-none outline-none"
                                   {...field}
                                   onChange={(e) => {
                                      field.onChange(e.target.value);
                                      form.setValue('subSector', ''); // Reset child on parent change
                                   }}
                                 >
                                    <option value="">Selecciona tu rubro...</option>
                                    {selectedRole && SECTORS[selectedRole].map(s => (
                                      <option key={s.id} value={s.id}>{s.label}</option>
                                    ))}
                                 </select>
                               </FormControl>
                               <FormMessage className="text-[10px] font-bold" />
                             </FormItem>
                           )} />

                           <AnimatePresence mode="wait">
                             {sectorId && (
                               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} key={sectorId}>
                                 <FormField control={form.control} name="subSector" render={({ field }) => (
                                   <FormItem className="space-y-1.5">
                                     <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Especialidad Técnica (Hijo)</FormLabel>
                                     <FormControl>
                                       <select className="flex w-full h-14 rounded-sm border-none bg-slate-50 px-4 text-base font-bold text-[#00213f] focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer appearance-none outline-none" {...field}>
                                         <option value="">Selecciona especialidad...</option>
                                         {selectedSectorData?.sub.map((s, i) => (
                                           <option key={i} value={s}>{s}</option>
                                         ))}
                                       </select>
                                     </FormControl>
                                     <FormMessage className="text-[10px] font-bold" />
                                   </FormItem>
                                 )} />
                               </motion.div>
                             )}
                           </AnimatePresence>

                           <FormField control={form.control} name={selectedRole === 'company' ? 'size' : 'experience'} render={({ field }) => (
                             <FormItem className="space-y-1.5">
                               <FormLabel className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                                  {selectedRole === 'company' ? 'Envergadura de Planta' : 'Trayectoria en el Rubro'}
                               </FormLabel>
                               <FormControl>
                                 <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input placeholder={selectedRole === 'company' ? 'Ej: 50 empleados' : 'Ej: 15 años'} className="h-14 pl-11 rounded-sm bg-slate-50 border-none focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-[#00213f]" {...field} />
                                 </div>
                               </FormControl>
                             </FormItem>
                           )} />
                        </div>

                        <Button type="button" onClick={() => validateStep(4)} className="w-full h-16 bg-[#00213f] hover:bg-black text-white font-black text-xl rounded-sm active:scale-[0.98] transition-all">
                           Membresías Oficiales <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* PHASE 5: PLANS */}
                    {step === 5 && (
                      <div className="space-y-8 py-2">
                        <div className="space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-black px-2.5 py-1 text-[10px] tracking-widest uppercase">Oficial Membership</Badge>
                           <h2 className="text-6xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Alcance.</h2>
                           <p className="text-base text-slate-500 font-inter">Niveles de presencia en el directorio industrial.</p>
                        </div>

                        <FormField control={form.control} name="plan" render={({ field }) => (
                          <div className="grid gap-3">
                            {[
                              { id: 'basic', label: 'Registro Estándar', price: 'Gratis', desc: 'Presencia pasiva' },
                              { id: 'premium', label: 'Suscripción Pro', price: '$25.000', desc: 'Partner Verificado 2026', featured: true }
                            ].map(p => (
                              <div 
                                 key={p.id} onClick={() => field.onChange(p.id)} 
                                 className={cn(
                                   "p-6 rounded-sm border-2 transition-all cursor-pointer relative overflow-hidden",
                                   field.value === p.id ? "bg-primary-50 border-primary-600 shadow-2xl ring-1 ring-primary-200" : "bg-white border-slate-100 hover:border-slate-200"
                                 )}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={cn("h-10 w-10 flex items-center justify-center rounded-sm", field.value === p.id ? "bg-primary-600 text-white" : "bg-slate-50 text-slate-300")}>
                                          {p.id === 'premium' ? <Rocket className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                                       </div>
                                       <div>
                                          <h3 className="text-xl font-bold text-[#00213f] leading-none mb-1">{p.label}</h3>
                                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.desc}</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-2xl font-black text-[#00213f] tracking-tighter leading-none">{p.price}</p>
                                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">por mes</p>
                                    </div>
                                 </div>
                                 {p.featured && <Badge className="absolute top-2 right-2 bg-primary-600 border-none font-bold text-[8px] uppercase tracking-widest px-2 h-4">Recomendado</Badge>}
                              </div>
                            ))}
                          </div>
                        )} />

                        <div className="space-y-4 pt-6">
                          <Button 
                            type="submit" disabled={isLoading} 
                            className="w-full h-18 bg-primary-600 hover:bg-primary-700 text-white font-black text-2xl rounded-sm shadow-2xl transition-all active:scale-[0.98]"
                          >
                            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Finalizar Registro'}
                          </Button>
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
