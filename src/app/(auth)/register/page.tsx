'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import { 
  Building2, Truck, Loader2, CheckCircle2, ArrowRight, ChevronLeft, ShieldCheck, 
  Target, Award, Globe, Lock, Mail, User, LayoutDashboard, Megaphone, Rocket, 
  Shield, Check, Search, Factory, Settings2, MapPin, FileText, Phone, Link2
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utilidades'

// ─── OFFICIAL TAXONOMY ───

const ALL_SECTORS = [
  // Industriales y de Producción
  { id: 'alimentos', label: 'Alimentaria y Agroindustria', sub: ['Frigoríficos', 'Lácteos', 'Panificación Industrial', 'Envasado y Conservas', 'Bebidas', 'Molinería y Cereales'] },
  { id: 'auto', label: 'Automotriz y Autopartes', sub: ['Fabricación de Piezas', 'Carrocería Especial', 'Rectificación', 'Mecánica Pesada'] },
  { id: 'construccion', label: 'Construcción y Materiales', sub: ['Hormigón/Viguetas', 'Cerámicas y Revestimientos', 'Aberturas Industriales', 'Obras de Planta', 'Sanitaria Industrial'] },
  { id: 'farma', label: 'Farma y Cosmética', sub: ['Laboratorio Industrial', 'Instalaciones Médicas', 'Insumos Hospitalarios'] },
  { id: 'madera', label: 'Madera y Papel', sub: ['Aserradero', 'Muebles Industriales', 'Cartón y Embalaje', 'Carpintería Industrial'] },
  { id: 'metal', label: 'Metalmecánica y Metalurgia', sub: ['Tornería y CNC', 'Soldadura Industrial', 'Fundición', 'Corte Láser/Plasma', 'Matricería', 'Chapa, Perfiles y Corte', 'Fabricación de Estructuras'] },
  { id: 'ceramica', label: 'Minerales y Cerámica', sub: ['Refractarios/Aislantes', 'Vidrio Industrial', 'Cal y Cemento Especial'] },
  { id: 'plasticos', label: 'Plásticos y Envases', sub: ['Inyección y Soplado', 'Packaging Industrial', 'Caucho y Gomas', 'Fibra de Vidrio'] },
  { id: 'quimica', label: 'Química y Petroquímica', sub: ['Productos Químicos', 'Pinturas', 'Lubricantes', 'Gases Industriales', 'Plásticos/Polímeros', 'Agroquímicos'] },
  { id: 'textil', label: 'Textil e Indumentaria', sub: ['Tejidos y Hilados', 'Indumentaria Laboral/EPP', 'Calzado Industrial', 'Bordado/Estampado', 'Confección'] },
  
  // Servicios y Proveedores (Ampliados)
  { id: 'agro', label: 'Agropecuario (Servicios)', sub: ['Maquinaria Agrícola', 'Insumos Rurales', 'Infraestructura de Silos', 'Riego Industrial'] },
  { id: 'automotriz_civil', label: 'Automotriz y Servicios Vehiculares (Civiles)', sub: ['Taller Mecánico', 'Gomería', 'Lavadero y Estética', 'Concesionaria y Usados', 'Motos y Bicicletas'] },
  { id: 'comercio', label: 'Comercio Minorista y Mayorista', sub: ['Electrodomésticos y Electrónica', 'Ferretería y Corralón', 'Indumentaria y Calzado', 'Librería y Papelería', 'Mayorista y Distribución'] },
  { id: 'educacion', label: 'Educación y Capacitación', sub: ['Instituto Educativo', 'Capacitación Laboral', 'Tutoría y Apoyo Escolar', 'Idiomas'] },
  { id: 'energy', label: 'Energía y Utilities', sub: ['Montajes Eléctricos', 'Instalaciones de Gas', 'Grupos Electrógenos', 'Tratamiento de Efluentes'] },
  { id: 'gastronomia', label: 'Gastronomía y Alimentos', sub: ['Panadería y Pastelería', 'Restaurant y Rotisería', 'Cafetería y Bar', 'Catering y Eventos', 'Elaboración de Alimentos', 'Distribuidora de Alimentos'] },
  { id: 'grafica', label: 'Gráfica y Señalética', sub: ['Cartelería', 'Impresión Gran Formato', 'Branding y Publicidad'] },
  { id: 'inmobiliario', label: 'Inmobiliario y Alquileres', sub: ['Inmobiliaria', 'Alquiler de Espacios', 'Desarrolladora'] },
  { id: 'insumos', label: 'Insumos y Herramientas', sub: ['Rodamientos/Transmisión', 'E.P.P. (Seguridad)', 'Herramientas Neumáticas', 'Consumibles Soldadura'] },
  { id: 'logistica', label: 'Logística y Almacenamiento', sub: ['Transporte de Carga', 'Depósitos/3PL', 'Grúas y Elevación', 'Mudanzas Industriales'] },
  { id: 'mante', label: 'Mantenimiento Industrial y General', sub: ['Mecánica Industrial', 'Electricidad Industrial', 'Instrumental/PLC', 'Hidráulica y Neumática', 'Oficios y Servicios Civiles Generales'] },
  { id: 'salud_estetica', label: 'Salud, Estética y Bienestar', sub: ['Clínica y Consultorio', 'Veterinaria', 'Farmacia y Óptica', 'Estética y Belleza', 'Gimnasio y Deporte'] },
  { id: 'salud', label: 'Seguridad e Higiene / Salud Laboral', sub: ['Medicina Laboral', 'Consultoría H&S', 'Capacitación en Planta', 'Extintores/Emergencias'] },
  { id: 'facilities', label: 'Servicios de Planta y Generales', sub: ['Limpieza Industrial', 'Seguridad y Vigilancia', 'Gestión de Residuos', 'Catering/Comedores', 'Mensajería y Cadetería'] },
  { id: 'prof', label: 'Servicios Profesionales y Consultoría', sub: ['Ingeniería y Proyectos', 'Normas ISO/Certificaciones', 'RRHH', 'Gestión Ambiental', 'Legal y Contable', 'Diseño y Arquitectura', 'Fotografía y Audiovisual'] },
  { id: 'tech', label: 'Tecnología y Electrónica', sub: ['Automatización Industrial', 'Instrumentación', 'Telecomunicaciones', 'Software Comercial/Industrial'] },
].sort((a, b) => a.label.localeCompare(b.label));

// ─── VALIDATION SCHEMA ───

const registerSchema = z.object({
  role: z.enum(['company', 'provider'], { message: 'Selecciona una categoría' }),
  tipoEmpresa: z.string().optional(),
  tipoProveedor: z.string().optional(),
  
  // -- Identidad --
  razonSocial: z.string().optional(),
  nombreFantasia: z.string().optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  nombreComercial: z.string().optional(),
  
  cuit: z.string().regex(/^\d{11}$/, { message: 'Debe contener exactamente 11 números, sin guiones.' }),
  telefono: z.string().min(8, { message: 'Teléfono o WhatsApp requerido' }),
  sitioWeb: z.string().optional(),

  // -- Ubicación & Perfil --
  provincia: z.string().min(2, { message: 'Provincia es requerida' }),
  localidad: z.string().min(2, { message: 'Localidad es requerida' }),
  direccion: z.string().min(3, { message: 'Dirección es requerida' }),
  descripcion: z.string().min(20, { message: 'Breve descripción obligatoria (Mín: 20 chars)' }),

  // -- Taxonomía --
  sectorId: z.string().min(1, { message: 'Selecciona un rubro' }),
  subSector: z.string().min(1, { message: 'Selecciona una especialidad' }),
  experience: z.string().optional(),
  size: z.string().optional(),

  // -- Credenciales --
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' }),
  confirmPassword: z.string(),
  plan: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.role === 'company') {
    if (!data.razonSocial || data.razonSocial.length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La Razón Social es obligatoria", path: ["razonSocial"] });
    }
    if (!data.tipoEmpresa) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La Clasificación es obligatoria", path: ["tipoEmpresa"] });
    }
  } else {
    if (!data.nombre || data.nombre.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tu nombre es obligatorio", path: ["nombre"] });
    }
    if (!data.apellido || data.apellido.length < 2) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tu apellido es obligatorio", path: ["apellido"] });
    }
    if (!data.tipoProveedor) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El Tipo de Prestador es obligatorio", path: ["tipoProveedor"] });
    }
  }
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

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'company',
      razonSocial: '', nombreFantasia: '', nombre: '', apellido: '', nombreComercial: '',
      cuit: '', telefono: '', sitioWeb: '', tipoEmpresa: '', tipoProveedor: '',
      provincia: '', localidad: '', direccion: '', descripcion: '',
      sectorId: '', subSector: '', experience: '', size: '',
      email: '', password: '', confirmPassword: '', plan: 'basic'
    },
  })

  // Pre-select role from URL
  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'provider' || roleParam === 'company') {
      form.setValue('role', roleParam)
    }
  }, [searchParams, form])

  const selectedRole = form.watch('role')
  const password = form.watch('password')
  const sectorId = form.watch('sectorId')
  
  const passRequirements = useMemo(() => [
    { label: "8+ Caracteres", met: password.length >= 8 },
    { label: "Mayúscula", met: /[A-Z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Esp. (@#$)", met: /[^A-Za-z0-9]/.test(password) }
  ], [password])

  const passStrength = useMemo(() => getPasswordStrength(password), [password])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const nextStep = () => {
    setStep(prev => prev + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const prevStep = () => { if (step > 1) setStep(prev => prev - 1) }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        validateStep(step);
      }
    }
  }

  // Determine what to validate per step
  const validateStep = async (currentStep: number) => {
    let fieldsToValidate: (keyof RegisterValues)[] = []
    
    if (currentStep === 1) fieldsToValidate = ['role']
    else if (currentStep === 3) {
      // Identity & Contact
      fieldsToValidate = selectedRole === 'company' 
        ? ['razonSocial', 'nombreFantasia', 'tipoEmpresa', 'cuit', 'telefono', 'sitioWeb']
        : ['nombre', 'apellido', 'tipoProveedor', 'nombreComercial', 'cuit', 'telefono', 'sitioWeb']
    }
    else if (currentStep === 4) fieldsToValidate = ['provincia', 'localidad', 'direccion', 'descripcion']
    else if (currentStep === 5) fieldsToValidate = ['sectorId', 'subSector', selectedRole === 'company' ? 'size' : 'experience']
    else if (currentStep === 6) fieldsToValidate = ['email', 'password', 'confirmPassword']
    
    // Step 2 assumes read-only, Step 7 is final submission.
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate)
      if (!isValid) {
        const errors = form.formState.errors
        Object.values(errors).forEach(err => {
           if (err?.message) toast.warning(err.message as string)
        })
        return
      }

      // ── Early email duplicate check on Step 6 ──
      if (currentStep === 6) {
        try {
          const emailValue = form.getValues('email').toLowerCase().trim()
          const res = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailValue }),
          })
          const { exists } = await res.json()

          if (exists) {
            toast.error('Este email ya está registrado en UIAB Conecta', {
              description: 'Si ya tenés una cuenta, podés iniciar sesión directamente o recuperar tu contraseña.',
              duration: 8000,
            })
            setEmailAlreadyExists(true)
            return // Don't advance to plan selection
          }
          setEmailAlreadyExists(false)
        } catch {
          // If the check fails, let it continue — the final signUp will catch it
        }
      }

      nextStep()
    } else {
      nextStep()
    }
  }

  async function onSubmit(values: RegisterValues) {
    if (step < 7) {
      validateStep(step);
      return;
    }
    setIsLoading(true)
    
    try {
      // We create the user using Supabase Auth
      const fullName = values.role === 'company' ? values.razonSocial : `${values.nombre} ${values.apellido}`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { nombre_completo: fullName } // This is strictly for auth metadata
        }
      })

      if (authError || !authData.user) {
        // Translate common Supabase Auth errors to Spanish
        const rawMsg = authError?.message || ''
        const isAlreadyRegistered = rawMsg.toLowerCase().includes('already registered') || rawMsg.toLowerCase().includes('already been registered')
        
        if (isAlreadyRegistered) {
          toast.error('Este email ya está registrado', {
            description: 'Si ya tenés una cuenta, podés iniciar sesión o recuperar tu contraseña.',
            duration: 8000,
          })
          setEmailAlreadyExists(true)
          setStep(6) // Send them back to the email step
        } else {
          toast.error('Error al registrarse', { description: rawMsg })
        }
        setIsLoading(false)
        return
      }

      // Send to our NextJS backend sync API to create the full profile and specific entity (Empresa or Proveedor)
      const res = await fetch('/api/auth/register-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: authData.user.id,
          payload: values, // Send ALL values, the backend will decide what to map
          fullName: fullName
        }),
      })

      if (!res.ok) {
        toast.error('Ocurrió un error al generar tu perfil.')
        setIsLoading(false)
        return
      }

      setIsSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
    } catch (err) {
      toast.error('Error de Sistema. Intenta más tarde.')
      setIsLoading(false)
    }
  }

  const checklistItems = useMemo(() => {
    if (selectedRole === 'company') {
      return [
        { icon: Award, label: "Beneficios Exclusivos", desc: "Convenios, descuentos y servicios para socios." },
        { icon: LayoutDashboard, label: "Capacitaciones y Eventos", desc: "Actividades, formación y novedades institucionales." },
        { icon: Globe, label: "Red de Vinculación", desc: "Conectá con empresas, instituciones y miembros." }
      ]
    }
    return [
      { icon: Megaphone, label: "Visibilidad en la Red", desc: "Aparecé en el directorio oficial de particulares." },
      { icon: Target, label: "Oportunidades Comerciales", desc: "Ofrecé tus productos y servicios a los socios." },
      { icon: Award, label: "Contacto con Empresas", desc: "Accedé a industrias, comercios y potenciales clientes." }
    ]
  }, [selectedRole])

  const selectedSectorData = useMemo(() => {
    if (!sectorId) return null;
    return ALL_SECTORS.find(s => s.id === sectorId);
  }, [sectorId]);

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-screen w-full items-center justify-center p-6 bg-slate-50">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center max-w-lg bg-white p-12 rounded-2xl shadow-xl border border-slate-100">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-amber-50 mb-8 border border-amber-100 shadow-xl shadow-amber-900/5">
            <Lock className="h-10 w-10 text-amber-600" />
          </div>
          <h2 className="text-4xl font-black text-[#00213f] mb-4 tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
            Perfil en Revisión
          </h2>
          <p className="text-slate-500 mb-8 font-inter text-lg">
            ¡Tu pre-registro fue completado exitosamente! La administración de <strong>UIAB Conecta</strong> está evaluando tu solicitud.
          </p>
          <div className="bg-slate-50 rounded-xl p-6 text-sm text-slate-600 mb-8 text-left space-y-3">
             <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Recibirás un email confirmando la recepción de tus datos.</p>
             <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Una vez aprobado, tu perfil será público en el Directorio Comercial.</p>
             <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Podrás ingresar al tablero central con tu email y contraseña.</p>
          </div>
          <Button onClick={() => router.push('/')} variant="outline" className="w-full h-14 border-slate-200 font-bold hover:bg-slate-50">
             Volver al Inicio
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex w-full bg-white font-sans selection:bg-primary-100 flex-1 min-h-0 h-full pt-0" onKeyDown={handleKeyDown}>
      <div className="w-full bg-white overflow-hidden grid lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] flex-1 min-h-0">
        
        {/* SIDEBAR EDITORIAL */}
        <div className="relative hidden lg:flex flex-col justify-between p-8 lg:p-12 bg-[#00213f] text-white pt-12 lg:pt-16">
          <AnimatePresence mode="wait">
            <motion.div key={selectedRole || 'intro'} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 0.25, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
              {(!selectedRole) && <Image src="/landing/hero-industrial.png" alt="Industrial" fill className="object-cover grayscale" priority />}
              {(selectedRole === 'company') && <Image src="/landing/hero-dashboard.png" alt="Analítica" fill className="object-cover" priority />}
              {(selectedRole === 'provider') && <Image src="/landing/provider-hero-v2.png" alt="Oficios" fill className="object-cover grayscale" priority />}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#00213f] via-[#00213f]/60 to-transparent z-0" />
          
          <div className="relative z-10 space-y-6 lg:space-y-8 max-w-lg mt-0">
            <AnimatePresence mode="wait">
              <motion.div key={selectedRole || 'intro'} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tighter mb-3 lg:mb-4" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                  {step === 1 && "Elegí tu tipo de registro."}
                  {step > 1 && selectedRole === 'company' && "Ser Socio UIAB."}
                  {step > 1 && selectedRole === 'provider' && "Ser Particular."}
                </h1>
                <p className="text-white/60 text-sm lg:text-base leading-relaxed mb-6 lg:mb-8 font-inter max-w-sm">
                  {step === 1 && "Registrate como Socio para acceder a beneficios, capacitaciones, actividades y servicios exclusivos. O como Particular para ofrecer tus productos o servicios y vincularte con empresas y socios de la institución."}
                  {step > 1 && selectedRole === 'company' && "Accedé a beneficios exclusivos, capacitaciones, convenios y oportunidades de vinculación con otras empresas, instituciones y miembros de la red."}
                  {step > 1 && selectedRole === 'provider' && "Ganá visibilidad dentro de la red, ofrecé tus productos y servicios a los socios y conectá con empresas, industrias y potenciales clientes."}
                </p>

                {selectedRole && (
                  <div className="space-y-3">
                    {checklistItems.map((item, i) => (
                      <motion.div key={i} variants={itemFade} initial="initial" animate="animate" transition={{ delay: 0.1 * i }} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/5">
                        <div className="h-10 w-10 flex items-center justify-center text-primary-200 rounded-lg bg-white/10 ring-1 ring-white/20">
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white text-base leading-tight mb-0.5">{item.label}</h3>
                          <p className="text-white/40 text-xs leading-tight">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex items-center justify-between mt-12 border-t border-white/10 pt-6">
             <div className="flex items-center gap-2">
                <Image src="/logo-prueba.png" alt="Logo" width={24} height={24} className="brightness-0 invert opacity-50" />
                <span className="text-white/50 font-bold text-sm tracking-widest uppercase">UIAB Conecta</span>
             </div>
             <p className="text-white/30 text-xs">Paso {step} de 7</p>
          </div>
        </div>

        {/* ─── FORM CONTENT ─── */}
        <div className="flex flex-col p-4 sm:p-5 lg:p-6 relative w-full flex-1 min-h-0">
          <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center">
            
            <div className="flex items-center justify-between mb-4 sm:mb-6 w-full">
             <div className="flex items-center gap-4">
                {step > 1 && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} onClick={prevStep} type="button"
                    className="h-12 w-12 rounded-full flex items-center justify-center text-slate-400 hover:text-[#00213f] hover:bg-slate-100 transition-all border border-slate-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>
                )}
                <div className="flex items-center gap-1.5 hidden sm:flex">
                   {[1,2,3,4,5,6,7].map(i => (
                     <div key={i} className={cn("h-2 rounded-full transition-all duration-500", step === i ? "w-10 bg-primary-600" : (i < step ? "w-4 bg-slate-300" : "w-2 bg-slate-100"))} />
                   ))}
                </div>
             </div>
             <div>
                <span className="text-sm font-bold text-slate-400">¿Ya tienes cuenta? </span>
                <Link href="/login" className="text-sm font-bold text-primary-600 hover:underline">Ingresar</Link>
             </div>
          </div>

          <div className="w-full max-w-xl mx-auto flex-1">
            <AnimatePresence mode="wait">
              <motion.div key={step} variants={pageTransition} initial="initial" animate="animate" exit="exit" className="h-full">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    
                    {/* ─── PHASE 1: ROLE ─── */}
                    {step === 1 && (
                      <div className="space-y-4 lg:space-y-6">
                        <div className="space-y-1">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">Registro</Badge>
                           <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>¿Cómo querés<br />registrarte?</h2>
                           <p className="text-sm text-slate-500 font-inter pt-2 max-w-md">Elegí tu tipo de registro. Podés ser parte de UIAB como Socio o como Particular de productos y servicios.</p>
                        </div>

                        <div className="grid gap-4">
                          <FormField control={form.control} name="role" render={({ field }) => (
                            <>
                               <div onClick={() => field.onChange('company')} className={cn("p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4", field.value === 'company' ? "bg-primary-50 border-primary-600 shadow-xl ring-1 ring-primary-100" : "bg-white border-slate-200 hover:border-slate-300")}>
                                <div className={cn("h-12 w-12 shrink-0 rounded-lg flex items-center justify-center transition-all", field.value === 'company' ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30" : "bg-slate-100 text-slate-500")}>
                                  <Factory className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                     <h3 className="text-xl font-bold text-[#00213f] leading-none">Quiero ser Socio</h3>
                                     <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", field.value === 'company' ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300")}><Check className="h-2.5 w-2.5 opacity-0" style={{ opacity: field.value === 'company' ? 1 : 0 }} /></div>
                                  </div>
                                  <p className="text-xs font-inter text-slate-500 pr-4">Empresa, institución, comercio u organización que quiere acceder a beneficios, capacitaciones, eventos, convenios y oportunidades de la institución.</p>
                                </div>
                              </div>

                               <div onClick={() => field.onChange('provider')} className={cn("p-4 sm:p-5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4", field.value === 'provider' ? "bg-primary-50 border-primary-600 shadow-xl ring-1 ring-primary-100" : "bg-white border-slate-200 hover:border-slate-300")}>
                                <div className={cn("h-12 w-12 shrink-0 rounded-lg flex items-center justify-center transition-all", field.value === 'provider' ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30" : "bg-slate-100 text-slate-500")}>
                                  <User className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                     <h3 className="text-xl font-bold text-[#00213f] leading-none">Quiero ser Particular</h3>
                                     <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", field.value === 'provider' ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300")}><Check className="h-2.5 w-2.5 opacity-0" style={{ opacity: field.value === 'provider' ? 1 : 0 }} /></div>
                                  </div>
                                  <p className="text-xs font-inter text-slate-500 pr-4">Empresa o persona que ofrece productos o servicios. Ganá visibilidad, presencia en el directorio y contacto directo con empresas, industrias y socios de la institución.</p>
                                </div>
                              </div>
                            </>
                          )} />
                        </div>

                        <Button type="button" onClick={() => validateStep(1)} className="w-full h-12 sm:h-14 bg-[#00213f] hover:bg-black text-white font-black text-base sm:text-lg rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                          Continuar <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 2: VALUE PROP ─── */}
                    {step === 2 && (
                      <div className="space-y-4 lg:space-y-5 text-center">
                         <div className="space-y-1 lg:space-y-2">
                            <h2 className="text-3xl lg:text-4xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                               {selectedRole === 'company' ? "Beneficios de Socio." : "Visibilidad Profesional."}
                            </h2>
                            <p className="text-sm lg:text-base text-slate-500 max-w-md mx-auto">
                               {selectedRole === 'company'
                                 ? "Accedé a beneficios exclusivos, capacitaciones, eventos, convenios, oportunidades y novedades institucionales. Conectá con otras empresas, instituciones y miembros de la red."
                                 : "Ofrecé tus productos y servicios a los socios, participá en oportunidades comerciales y ganá presencia en el directorio oficial."}
                            </p>
                         </div>

                         <div className="relative aspect-[16/10] sm:aspect-[2/1] lg:aspect-[2.3/1] rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                            <Image src={selectedRole === 'company' ? "/landing/platform-preview.png" : "/landing/register-provider.png"} alt="Contexto" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#00213f]/80 via-transparent to-transparent flex items-end p-4 lg:p-5">
                              <Badge className="bg-primary-600 border-none font-bold text-[10px] sm:text-xs shadow-lg tracking-widest uppercase">UIAB Conecta</Badge>
                           </div>
                        </div>

                        <Button type="button" onClick={nextStep} className="w-full h-12 lg:h-13 bg-[#00213f] hover:bg-black text-white font-black text-base lg:text-lg rounded-xl transition-all active:scale-[0.98]">
                          Aceptar y Configurar Perfil <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 3: IDENTITY & CONTACT ─── */}
                    {step === 3 && (
                      <div className="space-y-6 lg:space-y-8">
                        <div className="space-y-1 lg:space-y-2">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2.5 py-1 text-[10px] sm:text-xs tracking-widest uppercase rounded-sm">Datos Públicos</Badge>
                           <h2 className="text-3xl sm:text-5xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Identidad.</h2>
                        </div>

                        <div className="grid gap-3 sm:gap-4 bg-slate-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                          
                          {/* DYNAMIC FIELDS FOR COMPANY */}
                          {selectedRole === 'company' && (
                            <>
                              <FormField control={form.control} name="tipoEmpresa" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Socio *</FormLabel>
                                   <FormControl>
                                     <select className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none" {...field}>
                                        <option value="">Selecciona tipo...</option>
                                        <option value="empresa">Empresa / Industria</option>
                                        <option value="institucion">Institución / Organización</option>
                                        <option value="comercio">Comercio Minorista/Mayorista</option>
                                        <option value="gastronomia">Gastronomía y Alimentos</option>
                                        <option value="salud">Salud y Estética</option>
                                        <option value="educacion">Educación y Capacitación</option>
                                        <option value="servicios_generales">Servicios Generales</option>
                                     </select>
                                   </FormControl>
                                   <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="razonSocial" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Razón Social / Nombre Institucional *</FormLabel>
                                   <FormControl><Input placeholder="Ej: Industria Ejemplo S.A. / Fundación Ejemplo" className="h-12 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} /></FormControl>
                                   <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="nombreFantasia" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre de Fantasía</FormLabel>
                                   <FormControl><Input placeholder="Ej: Aceros Ejemplo" className="h-12 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} /></FormControl>
                                </FormItem>
                              )} />
                            </>
                          )}

                          {/* DYNAMIC FIELDS FOR PROVIDER */}
                          {selectedRole === 'provider' && (
                            <>
                              <FormField control={form.control} name="tipoProveedor" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Prestador *</FormLabel>
                                   <FormControl>
                                     <select className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none" {...field}>
                                        <option value="">Selecciona tipo...</option>
                                        <option value="empresa">Empresa de Servicios</option>
                                        <option value="profesional_independiente">Profesional Independiente</option>
                                        <option value="monotributista">Monotributista / Oficio</option>
                                        <option value="particular">Particular</option>
                                     </select>
                                   </FormControl>
                                   <FormMessage />
                                </FormItem>
                              )} />
                              <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="nombre" render={({ field }) => (
                                  <FormItem>
                                     <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre *</FormLabel>
                                     <FormControl><Input placeholder="Juan" className="h-12 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} /></FormControl>
                                     <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={form.control} name="apellido" render={({ field }) => (
                                  <FormItem>
                                     <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Apellido *</FormLabel>
                                     <FormControl><Input placeholder="Pérez" className="h-12 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} /></FormControl>
                                     <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                              <FormField control={form.control} name="nombreComercial" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial (Agencia/Taller)</FormLabel>
                                   <FormControl><Input placeholder="Ej: Electromecánica Pérez" className="h-12 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} /></FormControl>
                                </FormItem>
                              )} />
                            </>
                          )}

                          {/* SHARED FIELDS */}
                          <FormField control={form.control} name="cuit" render={({ field }) => (
                            <FormItem>
                               <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CUIT *</FormLabel>
                               <FormControl>
                                 <div className="relative group">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-600" />
                                    <Input placeholder="Ej: 30112233445 (Solo 11 números, sin guiones)" maxLength={11} className="h-12 pl-12 font-semibold text-base tracking-widest border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white font-mono" {...field} onChange={e => field.onChange(e.target.value.replace(/[^0-9]/g, ''))} />
                                 </div>
                               </FormControl>
                               <FormMessage />
                            </FormItem>
                          )} />

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="telefono" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Teléfono / WhatsApp *</FormLabel>
                                 <FormControl>
                                    <div className="relative group">
                                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600" />
                                       <Input placeholder="+54 9 11..." type="tel" className="h-14 pl-11 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} />
                                    </div>
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="sitioWeb" render={({ field }) => (
                              <FormItem>
                                 <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Web / Red Social</FormLabel>
                                 <FormControl>
                                    <div className="relative group">
                                       <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600" />
                                       <Input placeholder="www.ejemplo.com" className="h-14 pl-11 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white" {...field} />
                                    </div>
                                 </FormControl>
                                 <FormMessage />
                              </FormItem>
                            )} />
                          </div>
                        </div>

                        <Button type="button" onClick={() => validateStep(3)} className="w-full h-12 lg:h-14 bg-[#00213f] hover:bg-black text-white font-black text-lg lg:text-xl rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                           Siguiente: Ubicación <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 4: LOCATION AND BIOGRAPHY ─── */}
                    {step === 4 && (
                      <div className="space-y-4 lg:space-y-6">
                        <div className="space-y-1">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">Logística</Badge>
                           <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Localización.</h2>
                           <p className="text-slate-500 font-inter text-xs sm:text-sm">Para conectar con las mejores industrias locales, necesitamos saber de dónde eres y qué haces.</p>
                        </div>

                        <div className="grid gap-4 sm:gap-6">
                           <div className="grid sm:grid-cols-2 gap-4">
                              <FormField control={form.control} name="provincia" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Provincia *</FormLabel>
                                   <FormControl><Input placeholder="Ej: Buenos Aires" className="h-12 font-semibold text-base" {...field} /></FormControl>
                                   <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="localidad" render={({ field }) => (
                                <FormItem>
                                   <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Localidad/Partido *</FormLabel>
                                   <FormControl><Input placeholder="Ej: Burzaco / Alte. Brown" className="h-12 font-semibold text-base" {...field} /></FormControl>
                                   <FormMessage />
                                </FormItem>
                              )} />
                           </div>

                           <FormField control={form.control} name="direccion" render={({ field }) => (
                             <FormItem>
                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Dirección Completa *</FormLabel>
                                <FormControl>
                                  <div className="relative group">
                                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary-600" />
                                     <Input placeholder="Ej: Av. Tomás Espora 1234, Burzaco" className="h-12 pl-11 font-semibold text-base" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                           )} />

                           <FormField control={form.control} name="descripcion" render={({ field }) => (
                             <FormItem className="pt-2">
                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Breve Descripción Comercial (Perfil) *</FormLabel>
                                <FormControl>
                                   <textarea 
                                     placeholder={selectedRole === 'company' ? "Describe la capacidad productiva de tu planta, productos principales..." : "Describe tu experiencia, certificaciones o servicios destacados..."} 
                                     className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-none font-inter text-base focus:ring-primary-100" 
                                     {...field} 
                                   />
                                </FormControl>
                                <FormMessage />
                             </FormItem>
                           )} />
                        </div>

                        <Button type="button" onClick={() => validateStep(4)} className="w-full h-12 lg:h-14 bg-[#00213f] hover:bg-black text-white font-black text-lg lg:text-xl rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                           Definir Especialidad <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 5: TAXONOMY ─── */}
                    {step === 5 && (
                      <div className="space-y-4 lg:space-y-6">
                        <div className="space-y-1">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">ESPECIALIDAD</Badge>
                           <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Alcance.</h2>
                           <p className="text-slate-500 font-inter text-xs sm:text-sm">Selecciona tu macro-rubro y tu especialidad principal para que coincidan tus oportunidades.</p>
                        </div>

                        <div className="grid gap-4 bg-slate-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                           <FormField control={form.control} name="sectorId" render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Rubro Principal</FormLabel>
                               <FormControl>
                                 <select 
                                   className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none"
                                   {...field}
                                   onChange={(e) => { field.onChange(e.target.value); form.setValue('subSector', ''); }}
                                 >
                                    <option value="">Selecciona tu macro rubro...</option>
                                    {ALL_SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                 </select>
                               </FormControl>
                               <FormMessage />
                             </FormItem>
                           )} />

                           <AnimatePresence mode="wait">
                             {sectorId && (
                               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                 <FormField control={form.control} name="subSector" render={({ field }) => (
                                   <FormItem>
                                     <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sub-Especialidad Técnica</FormLabel>
                                     <FormControl>
                                       <select className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none" {...field}>
                                         <option value="">Selecciona tu especialidad...</option>
                                         {selectedSectorData?.sub.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                       </select>
                                     </FormControl>
                                     <FormMessage />
                                   </FormItem>
                                 )} />
                               </motion.div>
                             )}
                           </AnimatePresence>

                           <FormField control={form.control} name={selectedRole === 'company' ? 'size' : 'experience'} render={({ field }) => (
                             <FormItem className="pt-2">
                               <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                  {selectedRole === 'company' ? 'Cantidad de Empleados' : 'Años de Experiencia en el Perfil'}
                               </FormLabel>
                               <FormControl>
                                 <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    <Input placeholder={selectedRole === 'company' ? 'Ej: 50 empleados' : 'Ej: 15 años'} className="h-14 pl-11 font-semibold text-base border-slate-200 bg-white" {...field} />
                                 </div>
                               </FormControl>
                             </FormItem>
                           )} />
                        </div>

                        <Button type="button" onClick={() => validateStep(5)} className="w-full h-12 lg:h-14 bg-[#00213f] hover:bg-black text-white font-black text-lg lg:text-xl rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                           Credenciales <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 6: AUTH CREDENTIALS ─── */}
                    {step === 6 && (
                      <div className="space-y-4 lg:space-y-6">
                        <div className="flex items-start justify-between">
                           <div className="space-y-1">
                              <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">Seguridad</Badge>
                              <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Acceso.</h2>
                              <p className="text-slate-500 font-inter text-xs sm:text-sm">Estas credenciales serán las maestras para gestionar el panel.</p>
                           </div>
                           <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-slate-200 hidden sm:block" />
                        </div>

                        <div className="grid gap-4 sm:gap-6">
                          <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                               <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Acceso Módulo *</FormLabel>
                               <FormControl>
                                  <div className="relative group">
                                     <Mail className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors", emailAlreadyExists ? "text-rose-500" : "text-slate-400 group-focus-within:text-primary-600")} />
                                     <Input placeholder="admin@empresa.com" className={cn("h-12 pl-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all font-bold text-lg text-[#00213f]", emailAlreadyExists && "border-rose-300 bg-rose-50/50 focus:ring-rose-50 focus:border-rose-400")} {...field} onChange={(e) => { field.onChange(e); if (emailAlreadyExists) setEmailAlreadyExists(false); }} />
                                  </div>
                               </FormControl>
                               <AnimatePresence>
                                 {emailAlreadyExists && (
                                   <motion.div 
                                     initial={{ opacity: 0, height: 0 }} 
                                     animate={{ opacity: 1, height: 'auto' }} 
                                     exit={{ opacity: 0, height: 0 }}
                                     className="overflow-hidden"
                                   >
                                     <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                       <p className="text-sm font-bold text-amber-900">Este email ya tiene una cuenta en UIAB Conecta</p>
                                       <p className="text-xs text-amber-700/80 leading-relaxed">Si ya te registraste antes, no necesitás crear otra cuenta. Podés ingresar directamente o recuperar tu contraseña.</p>
                                       <div className="flex gap-2">
                                         <Link 
                                           href="/login" 
                                           className="flex-1 h-10 bg-[#00213f] hover:bg-[#10375c] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                         >
                                           <ArrowRight className="h-3.5 w-3.5" />
                                           Iniciar Sesión
                                         </Link>
                                         <Link 
                                           href="/recovery" 
                                           className="flex-1 h-10 bg-white hover:bg-slate-50 text-[#00213f] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 transition-colors"
                                         >
                                           <Lock className="h-3.5 w-3.5" />
                                           Recuperar Contraseña
                                         </Link>
                                       </div>
                                     </div>
                                   </motion.div>
                                 )}
                               </AnimatePresence>
                               <FormMessage />
                            </FormItem>
                          )} />

                          <div className="grid gap-4 bg-slate-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100">
                             <FormField control={form.control} name="password" render={({ field }) => (
                               <FormItem>
                                  <div className="flex items-center justify-between ml-1 mb-1">
                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest">Contraseña Segura *</FormLabel>
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-xs font-bold text-primary-600 uppercase hover:underline">
                                       {showPass ? 'Ocultar' : 'Mostrar'}
                                    </button>
                                  </div>
                                  <FormControl>
                                     <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-600" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-bold text-lg text-[#00213f] tracking-wider" {...field} />
                                     </div>
                                  </FormControl>
                                  
                                  <div className="pt-4 px-1">
                                     <div className="h-1.5 w-full bg-slate-200 rounded-full flex gap-1 overflow-hidden">
                                        {[1, 2, 3, 4].map((i) => (
                                          <div key={i} className={cn("h-full flex-1 transition-all duration-500", passStrength >= i*25 ? getStrengthColor(passStrength) : "bg-transparent")} />
                                        ))}
                                     </div>
                                     <div className="grid grid-cols-2 gap-2 pt-4">
                                        {passRequirements.map((req, i) => (
                                          <div key={i} className="flex items-center gap-2">
                                             <div className={cn("h-4 w-4 rounded-full flex items-center justify-center transition-all shadow-sm", req.met ? "bg-primary-500 text-white" : "border border-slate-300 bg-white")}>
                                                {req.met && <Check className="h-2.5 w-2.5" />}
                                             </div>
                                             <span className={cn("text-[10px] font-bold uppercase tracking-widest", req.met ? "text-primary-700" : "text-slate-400")}>{req.label}</span>
                                          </div>
                                        ))}
                                     </div>
                                  </div>
                                  <FormMessage />
                               </FormItem>
                             )} />

                             <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                               <FormItem className="pt-2">
                                  <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Repetir Contraseña *</FormLabel>
                                  <FormControl>
                                     <div className="relative group">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary-600" />
                                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" className="h-12 pl-12 rounded-xl bg-white border-slate-200 focus:ring-4 focus:ring-primary-50 transition-all font-bold text-lg text-[#00213f] tracking-wider" {...field} />
                                     </div>
                                  </FormControl>
                                  <FormMessage />
                               </FormItem>
                             )} />
                          </div>
                        </div>

                        <Button type="button" onClick={() => validateStep(6)} className="w-full h-12 lg:h-14 bg-[#00213f] hover:bg-black text-white font-black text-lg lg:text-xl rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                           Seleccionar Plan <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    )}

                    {/* ─── PHASE 7: PLANS & SUBMIT ─── */}
                    {step === 7 && (
                      <div className="space-y-4 lg:space-y-6">
                        <div className="space-y-1">
                           <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">MEMBRESÍAS OFICIALES</Badge>
                           <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Suscripción.</h2>
                           <p className="text-slate-500 font-inter text-xs sm:text-sm">Define tu nivel de presencia en el directorio.</p>
                        </div>

                        <FormField control={form.control} name="plan" render={({ field }) => (
                          <div className="grid gap-4">
                            {[
                              { id: 'basic', label: 'Estándar', price: 'Consultar', desc: 'Presencia base y recepción pasiva de cotizaciones.' },
                              { id: 'premium', label: 'Premium 2026', price: '$25.000 / mes', desc: 'Posicionamiento superior, sello validado y alertas proactivas.', featured: true }
                            ].map(p => (
                              <div key={p.id} onClick={() => field.onChange(p.id)} className={cn("p-4 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", field.value === p.id ? "bg-primary-50 border-primary-600 shadow-2xl ring-2 ring-primary-100" : "bg-white border-slate-200 hover:border-slate-300")}>
                                 <div className="flex items-start gap-4">
                                    <div className={cn("h-12 w-12 shrink-0 flex items-center justify-center rounded-xl", field.value === p.id ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30" : "bg-slate-100 text-slate-400")}><Rocket className="h-6 w-6" /></div>
                                    <div>
                                       <h3 className="text-2xl font-bold text-[#00213f] leading-none mb-2">{p.label}</h3>
                                       <p className="text-xs font-bold uppercase tracking-widest text-slate-500 max-w-[200px] leading-relaxed">{p.desc}</p>
                                    </div>
                                 </div>
                                 <div className="sm:text-right pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                                    <p className="text-3xl font-black text-[#00213f] tracking-tighter leading-none">{p.price}</p>
                                 </div>
                                 {p.featured && <Badge className="absolute top-4 right-4 bg-primary-600 border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 shadow-md">Recomendado</Badge>}
                              </div>
                            ))}
                          </div>
                        )} />

                        <div className="pt-6">
                          <Button type="submit" disabled={isLoading} className="w-full h-12 lg:h-14 bg-primary-600 hover:bg-primary-700 text-white font-black text-xl rounded-xl shadow-2xl shadow-primary-600/30 transition-all active:scale-[0.98]">
                            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : 'Finalizar Envío de Perfil'}
                          </Button>
                          <p className="text-center text-xs text-slate-400 font-medium mt-4 max-w-sm mx-auto">
                            Al hacer clic, aceptas que la administración revise tus datos. Recibirás una notificación por email.
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
  </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#00213f] animate-pulse">Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
