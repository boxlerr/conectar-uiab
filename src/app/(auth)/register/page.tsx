'use client'

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { createBrowserClient } from '@supabase/ssr'
import {
  Building2, Truck, Loader2, CheckCircle2, ArrowRight, ChevronLeft, ChevronDown, ShieldCheck,
  Target, Award, Globe, Lock, Mail, User, LayoutDashboard, Megaphone, Rocket,
  Shield, Check, Search, Factory, Settings2, MapPin, FileText, Phone, Link2, X, Sparkles, Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'

import { Button } from '@/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn, normalizarSitioWeb } from '@/lib/utilidades'
import { LOCALIDADES_ALMIRANTE_BROWN, PROVINCIAS_AR } from '@/lib/datos/geografia-ar'
import { useAuth } from '@/modulos/autenticacion/contexto-autenticacion'
import { PRECIO_MENSUAL, PRECIO_ANUAL } from '@/lib/mercadopago/suscripciones'

// Mismo número que se muestra en la landing para el plan anual: comparar
// siempre en $/mes es lo que hace evidente el descuento.
const EQUIVALENTE_MENSUAL = Math.round(PRECIO_ANUAL / 12) // 41.667

// ─── OFFICIAL TAXONOMY ───

const ALL_SECTORS = [
  // Industriales y de Producción
  { id: 'alimentos', label: 'Alimentaria y Agroindustria', sub: ['Frigoríficos', 'Lácteos', 'Panificación Industrial', 'Envasado y Conservas', 'Bebidas', 'Molinería y Cereales'] },
  { id: 'auto', label: 'Automotriz y Autopartes', sub: ['Fabricación de Piezas', 'Carrocería Especial', 'Rectificación', 'Mecánica Pesada'] },
  { id: 'construccion', label: 'Construcción y Materiales', sub: ['Hormigón/Viguetas', 'Cerámicas y Revestimientos', 'Aberturas Industriales', 'Obras de Planta', 'Sanitaria Industrial'] },
  { id: 'farma', label: 'Farma y Cosmética', sub: ['Laboratorio Industrial', 'Instalaciones Médicas', 'Insumos Hospitalarios'] },
  { id: 'madera', label: 'Madera y Papel', sub: ['Aserradero', 'Muebles Industriales', 'Cartón y Embalaje', 'Carpintería Industrial'] },
  { id: 'metal', label: 'Metalmecánica y Metalurgia', sub: ['Tornería y CNC', 'Soldadura Industrial', 'Fundición', 'Corte Láser/Plasma', 'Matricería', 'Chapas', 'Perfiles', 'Corte y Plegado', 'Herrería Industrial', 'Cerrajería Industrial', 'Fabricación de Estructuras'] },
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
  size: z.string().optional(), // empresas: string numérico de empleados

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
    // Empresa: cantidad_empleados obligatoria y numérica
    const empleadosNum = data.size ? parseInt(String(data.size).replace(/\D/g, ''), 10) : NaN;
    if (!Number.isFinite(empleadosNum) || empleadosNum <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingresá la cantidad de empleados (número)", path: ["size"] });
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

// ─── QUIÉN SE REGISTRA ───
// El campo sigue siendo 'company' | 'provider'; lo que cambia es cómo lo
// contamos. "Socio" confundía: socio de la UIAB es otra cosa (esas empresas
// entran por /sumate y no pagan).

const OPCIONES_REGISTRO = [
  {
    value: 'company' as const,
    icon: Factory,
    titulo: 'Empresa u organización',
    resumen: 'Aparecés en el directorio con tu razón social y los datos de tu empresa.',
    ejemplos: [
      'Industrias',
      'Comercios',
      'Entidades financieras',
      'Cooperativas',
      'Entidades educativas',
      'Instituciones',
    ],
  },
  {
    value: 'provider' as const,
    icon: User,
    titulo: 'Particular o profesional',
    resumen: 'Ofrecés tus productos o servicios a las empresas e industrias de la red.',
    ejemplos: [
      'Profesionales independientes',
      'Monotributistas y oficios',
      'Empresas de servicios',
      'Consultores',
    ],
  },
]

// Lo mismo para los dos: el precio y el acceso no dependen del tipo de cuenta.
const INCLUYE_CUENTA = [
  { icon: Building2, label: 'Tu ficha en el directorio', desc: 'Visible para toda la red industrial de Almirante Brown.' },
  { icon: Megaphone, label: 'Publicá lo que necesitás', desc: 'Cargá búsquedas y recibí propuestas de la red.' },
  { icon: Zap, label: 'Coincidencias automáticas', desc: 'Te avisamos cuando alguien busca lo que ofrecés.' },
  { icon: Phone, label: 'Contacto directo', desc: 'Teléfono, email y web de cada empresa, sin intermediarios.' },
]

// ─── ANIMATION VARIANTS ───

const pageTransition: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const } }
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
  const { refreshUser, currentUser } = useAuth()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'company',
      razonSocial: '', nombre: '', apellido: '', nombreComercial: '',
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

  // Ciclo elegido en la landing (?ciclo=mensual|anual). Lo arrastramos hasta el
  // checkout para que no tengan que elegirlo dos veces.
  const cicloElegido = searchParams.get('ciclo') === 'anual' ? 'anual'
    : searchParams.get('ciclo') === 'mensual' ? 'mensual'
    : null
  const destinoCheckout = cicloElegido
    ? `/suscripcion/checkout?ciclo=${cicloElegido}`
    : '/suscripcion/checkout'

  // Si ya estás logueado, no tiene sentido ver el registro: te mandamos al
  // directorio. (Evita el bug de quedar con /register abierto al iniciar sesión
  // desde acá.) No aplica a la pantalla de éxito recién creada.
  useEffect(() => {
    if (currentUser && !isSuccess) {
      router.replace('/directorio')
    }
  }, [currentUser, isSuccess, router])

  const selectedRole = form.watch('role')
  const password = form.watch('password')
  const sectorId = form.watch('sectorId')
  const [categorias, setCategorias] = useState<CategoriaDB[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then((d) => setCategorias(d.categorias || []))
      .catch(() => setCategorias([]))
  }, [])

  const passRequirements = useMemo(() => [
    { label: "8+ Caracteres", met: password.length >= 8 },
    { label: "Mayúscula", met: /[A-Z]/.test(password) },
    { label: "Número", met: /[0-9]/.test(password) },
    { label: "Esp. (@#$)", met: /[^A-Za-z0-9]/.test(password) }
  ], [password])

  const passStrength = useMemo(() => getPasswordStrength(password), [password])

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
        ? ['razonSocial', 'nombreComercial', 'tipoEmpresa', 'cuit', 'telefono', 'sitioWeb']
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
        const errorMessages = Object.values(errors).filter(err => err?.message)
        if (errorMessages.length > 1) {
          toast.warning('Completá todos los campos obligatorios antes de continuar.')
        } else if (errorMessages.length === 1) {
          toast.warning(errorMessages[0]!.message as string)
        }
        return
      }

      // ── Aviso temprano si el CUIT ya está en el padrón (paso 3) ──
      // Mejor acá que al final: si la empresa ya existe, register-sync rechaza
      // el alta, y no tiene sentido hacerles completar cuatro pantallas más y
      // elegir una contraseña para después borrarles la cuenta.
      if (currentStep === 3 && selectedRole === 'company') {
        try {
          const res = await fetch('/api/auth/check-cuit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cuit: form.getValues('cuit') }),
          })
          const { enPadron, esSocia, razonSocial } = await res.json()

          if (enPadron) {
            // Aviso, NO bloqueo. Antes esto cortaba el registro y los mandaba a
            // /sumate, pero la gente se registraba igual con el CUIT escrito de
            // otra forma y el directorio terminaba duplicado (Metalúrgica
            // Longchamps, Pinturería Giannoni). Ahora register-sync reusa la
            // ficha existente y le aplica los datos nuevos, así que dejamos
            // seguir y sólo explicamos qué va a pasar.
            const nombre = razonSocial || 'Esa empresa'
            toast.info(
              esSocia
                ? `${nombre} ya es socia de la UIAB`
                : `${nombre} ya está en UIAB Conecta`,
              {
                description: esSocia
                  ? 'No se crea una ficha nueva: vamos a vincular tu cuenta a la que ya existe y actualizarla con lo que cargues. Tu acceso no tiene cargo.'
                  : 'No se crea una ficha nueva: vamos a vincular tu cuenta a la que ya existe y actualizarla con lo que cargues.',
                duration: 10000,
              }
            )
          }
        } catch {
          // Si el chequeo falla seguimos: register-sync valida igual.
        }
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

      const esPrueba = values.plan === 'gratis_test';
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { nombre_completo: fullName },
          emailRedirectTo: esPrueba
            ? `${window.location.origin}/api/auth/callback?next=/panel-de-control`
            : `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(destinoCheckout)}`,
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
        // El 409 del control contra el padrón trae un mensaje que le sirve al
        // socio ("tu empresa ya es socia, pedí el acceso desde Sumate"): sería
        // una lástima taparlo con el genérico. Volvemos al paso del CUIT.
        const detalle = await res.json().catch(() => null)

        if (res.status === 409 && detalle?.motivo === 'cuit_en_padron') {
          toast.error(detalle.error, {
            duration: 14000,
            action: { label: 'Ir a Sumate', onClick: () => router.push('/sumate') },
          })
          setStep(3)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          toast.error(detalle?.error || 'Ocurrió un error al generar tu perfil.')
        }

        setIsLoading(false)
        return
      }

      setIsLoading(false)

      // Sin sesión = Supabase pidió confirmar el correo antes de dejar entrar
      // (item 1.1 del reporte de Lucas: "el sistema crea la cuenta y habilita la
      // navegación del panel sin enviar ni validar un mail de confirmación").
      // No podemos mandarlos al checkout: no hay sesión con la que operar. Va la
      // pantalla que ya les explica que revisen el correo, y el link del mail los
      // deja en el checkout vía emailRedirectTo.
      //
      // Escrito así el alta funciona con la confirmación prendida O apagada, así
      // que prender el toggle en Supabase no rompe nada.
      const requiereConfirmarEmail = !authData.session

      if (esPrueba || requiereConfirmarEmail) {
        setIsSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        await refreshUser()
        router.push(destinoCheckout)
      }

    } catch (err) {
      toast.error('Error de Sistema. Intenta más tarde.')
      setIsLoading(false)
    }
  }

  const checklistItems = useMemo(() => {
    if (selectedRole === 'company') {
      return [
        { icon: Building2, label: "Tu ficha en el directorio", desc: "Razón social, rubro, catálogo y datos de contacto." },
        { icon: Megaphone, label: "Publicá lo que necesitás", desc: "Tus búsquedas de proveedores llegan a toda la red." },
        { icon: Zap, label: "Coincidencias automáticas", desc: "Te avisamos cuando aparece una empresa que encaja." }
      ]
    }
    return [
      { icon: Megaphone, label: "Visibilidad en la red", desc: "Aparecés en el directorio oficial de la UIAB." },
      { icon: Target, label: "Oportunidades comerciales", desc: "Respondé las búsquedas que publican las empresas." },
      { icon: Phone, label: "Contacto directo", desc: "Las empresas te escriben sin intermediarios." }
    ]
  }, [selectedRole])

  const selectedSectorData = useMemo(() => {
    if (!sectorId) return null;
    return ALL_SECTORS.find(s => s.id === sectorId);
  }, [sectorId]);

  if (isSuccess) {
    return (
      <div className="flex flex-col min-h-svh w-full items-center justify-center p-6 bg-slate-50">
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="text-center max-w-lg bg-white p-6 sm:p-10 lg:p-12 rounded-2xl shadow-xl border border-slate-100">
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
            <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Confirmá tu email con el link que te enviamos.</p>
            <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Al confirmar, te llevaremos a completar el pago de tu suscripción mensual.</p>
            <p className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Una vez aprobado por UIAB, tu perfil será público en el Directorio Comercial.</p>
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
      {/* Sin overflow-hidden: recortaba los pasos altos sin generar scroll y comía
          los dropdowns absolute de BuscadorLista / BuscadorJerarquico. */}
      <div className="w-full bg-white grid md:grid-cols-[280px_1fr] lg:grid-cols-[450px_1fr] xl:grid-cols-[500px_1fr] flex-1 min-h-0">

        {/* SIDEBAR EDITORIAL */}
        <div className="relative hidden md:flex flex-col justify-between p-6 lg:p-12 bg-[#00213f] text-white pt-10 md:pt-12 lg:pt-16">
          <AnimatePresence mode="wait">
            <motion.div key={selectedRole || 'intro'} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 0.25, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 1 }} className="absolute inset-0 z-0">
              {(!selectedRole) && <Image src="/landing/hero-industrial.webp" alt="Industrial" fill className="object-cover grayscale" priority />}
              {(selectedRole === 'company') && <Image src="/landing/hero-dashboard.png" alt="Analítica" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />}
              {(selectedRole === 'provider') && <Image src="/landing/provider-hero-v2.png" alt="Oficios" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover grayscale" priority />}
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-[#00213f] via-[#00213f]/60 to-transparent z-0" />

          <div className="relative z-10 space-y-6 lg:space-y-8 max-w-lg mt-0">
            <AnimatePresence mode="wait">
              <motion.div key={selectedRole || 'intro'} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black leading-[1.1] tracking-tighter mb-3 lg:mb-4" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                  {step === 1 && "Todo lo que incluye tu cuenta."}
                  {step > 1 && selectedRole === 'company' && "Empresa u organización."}
                  {step > 1 && selectedRole === 'provider' && "Particular o profesional."}
                </h1>
                <p className="text-white/60 text-sm lg:text-base leading-relaxed mb-6 lg:mb-8 font-inter max-w-sm">
                  {step === 1 && "Una sola membresía, sin planes recortados ni funciones bloqueadas. Contanos quién se registra y en unos minutos tu empresa queda publicada en el directorio."}
                  {step > 1 && selectedRole === 'company' && "Tu empresa en el directorio de la red industrial de Almirante Brown: te encuentran, publicás lo que necesitás y contactás directo."}
                  {step > 1 && selectedRole === 'provider' && "Ofrecé tus productos y servicios a las empresas de la red, respondé sus búsquedas y ganá presencia en el directorio oficial."}
                </p>

                {/* Paso 1: qué se obtiene al pagar. Después, el detalle por tipo de cuenta. */}
                {step === 1 ? (
                  <div className="space-y-2.5">
                    {INCLUYE_CUENTA.map((item, i) => (
                      <motion.div key={item.label} variants={itemFade} initial="initial" animate="animate" transition={{ delay: 0.08 * i }} className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/5">
                        <div className="h-9 w-9 flex items-center justify-center text-primary-200 rounded-lg bg-white/10 ring-1 ring-white/20 shrink-0">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-sm leading-tight">{item.label}</h3>
                          <p className="text-white/40 text-[11px] leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}

                    <motion.div variants={itemFade} initial="initial" animate="animate" transition={{ delay: 0.4 }} className="rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Membresía</p>
                      {/* Mostramos el mismo número que vio en la landing: si eligió
                          anual, el precio por mes ya viene con el descuento. */}
                      <p className="text-white font-black text-2xl tracking-tight mt-0.5">
                        ${(cicloElegido === 'anual' ? EQUIVALENTE_MENSUAL : PRECIO_MENSUAL).toLocaleString('es-AR')}
                        <span className="text-sm font-semibold text-white/40 ml-1">/ mes</span>
                        {cicloElegido === 'anual' && (
                          <span className="text-sm font-semibold text-white/30 ml-2 line-through">
                            ${PRECIO_MENSUAL.toLocaleString('es-AR')}
                          </span>
                        )}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        {cicloElegido === 'anual'
                          ? `Un solo pago de $${PRECIO_ANUAL.toLocaleString('es-AR')} al año — 2 meses gratis.`
                          : `O $${PRECIO_ANUAL.toLocaleString('es-AR')} al año y te ahorrás 2 meses. Cancelás cuando quieras.`}
                      </p>
                    </motion.div>
                  </div>
                ) : selectedRole && (
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
          <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-start lg:justify-center">

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
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <div key={i} className={cn("h-2 rounded-full transition-all duration-500", step === i ? "w-10 bg-primary-600" : (i < step ? "w-4 bg-slate-300" : "w-2 bg-slate-100"))} />
                  ))}
                </div>
              </div>
              <div>
                <span className="hidden sm:inline text-sm font-bold text-slate-400">¿Ya tienes cuenta? </span>
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
                        <div className="space-y-4 lg:space-y-5">
                          <div className="space-y-1">
                            <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-1 text-[10px] tracking-widest uppercase rounded-sm">Registro · Paso 1 de 7</Badge>
                            <h2 className="text-2xl sm:text-4xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>¿Quién se registra?</h2>
                            <p className="text-sm text-slate-500 font-inter pt-2 max-w-md">
                              Elegí la opción que describe a tu organización. El acceso y el precio son los
                              mismos en los dos casos: sólo cambia cómo te mostramos en el directorio.
                            </p>
                          </div>

                          <FormField control={form.control} name="role" render={({ field }) => (
                            <div className="grid gap-3" role="radiogroup" aria-label="Tipo de registro">
                              {OPCIONES_REGISTRO.map((op) => {
                                const activa = field.value === op.value
                                return (
                                  <button
                                    key={op.value}
                                    type="button"
                                    role="radio"
                                    aria-checked={activa}
                                    onClick={() => field.onChange(op.value)}
                                    className={cn(
                                      "text-left p-4 sm:p-5 rounded-xl border-2 transition-all flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                                      activa
                                        ? "bg-primary-50 border-primary-600 shadow-xl ring-1 ring-primary-100"
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                                    )}
                                  >
                                    <div className={cn("h-12 w-12 shrink-0 rounded-lg flex items-center justify-center transition-all", activa ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30" : "bg-slate-100 text-slate-500")}>
                                      <op.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-3 mb-1">
                                        <h3 className="text-lg sm:text-xl font-bold text-[#00213f] leading-tight">{op.titulo}</h3>
                                        <div className={cn("h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center", activa ? "border-primary-600 bg-primary-600 text-white" : "border-slate-300")}>
                                          <Check className="h-2.5 w-2.5" style={{ opacity: activa ? 1 : 0 }} />
                                        </div>
                                      </div>
                                      <p className="text-xs font-inter text-slate-500">{op.resumen}</p>
                                      {/* Los ejemplos evitan la duda de "¿yo dónde entro?" */}
                                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                                        {op.ejemplos.map((ej) => (
                                          <span
                                            key={ej}
                                            className={cn(
                                              "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                              activa
                                                ? "bg-white border-primary-200 text-primary-700"
                                                : "bg-slate-50 border-slate-200 text-slate-500"
                                            )}
                                          >
                                            {ej}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          )} />

                          {/* Las socias UIAB no pagan: mejor desviarlas acá que cobrarles de más */}
                          <Link
                            href="/sumate"
                            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 hover:bg-emerald-50 transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-600 leading-relaxed">
                              <span className="font-bold text-emerald-800">¿Tu empresa ya es socia de la UIAB?</span>{' '}
                              Tu acceso está incluido en la cuota: activalo desde el alta de socias, sin cargo.
                              <span className="font-bold text-emerald-700 underline underline-offset-2 ml-1">Ir al alta →</span>
                            </p>
                          </Link>

                          <Button type="button" onClick={() => validateStep(1)} className="w-full h-12 sm:h-14 bg-[#00213f] hover:bg-black text-white font-black text-base sm:text-lg rounded-xl transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98]">
                            Continuar <ArrowRight className="ml-3 h-5 w-5" />
                          </Button>

                          {/* De md para arriba el detalle vive en la columna oscura; abajo esa
                              columna no existe, así que dejamos la versión corta. */}
                          <div className="md:hidden rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                            <p className="text-xs text-slate-600 leading-relaxed">
                              <span className="font-bold text-[#00213f]">Incluye todo:</span> ficha en el
                              directorio, publicación de necesidades, coincidencias automáticas y contacto
                              directo.
                            </p>
                            <p className="text-xs text-slate-500 mt-1.5">
                              <span className="font-black text-[#00213f]">${PRECIO_MENSUAL.toLocaleString('es-AR')}</span> por mes o{' '}
                              <span className="font-black text-[#00213f]">${PRECIO_ANUAL.toLocaleString('es-AR')}</span> al año
                              (2 meses bonificados). Cancelás cuando quieras.
                            </p>
                          </div>
                          <p className="text-[11px] text-slate-400 text-center">
                            Son 7 pasos cortos. Podés volver atrás en cualquier momento.
                          </p>
                        </div>
                      )}

                      {/* ─── PHASE 2: VALUE PROP ─── */}
                      {step === 2 && (
                        <div className="space-y-4 lg:space-y-5 text-center">
                          <div className="space-y-1 lg:space-y-2">
                            <h2 className="text-3xl lg:text-4xl font-black text-[#00213f] tracking-tighter leading-none" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>
                              {selectedRole === 'company' ? "Así se ve tu empresa." : "Así te ven las empresas."}
                            </h2>
                            <p className="text-sm lg:text-base text-slate-500 max-w-md mx-auto">
                              {selectedRole === 'company'
                                ? "Tu ficha queda publicada en el directorio de la red industrial: te encuentran por rubro, publicás lo que necesitás comprar y contactás directo con otras empresas."
                                : "Ofrecé tus productos y servicios a las empresas de la red, respondé las búsquedas que publican y ganá presencia en el directorio oficial."}
                            </p>
                          </div>

                          <div className="relative aspect-[16/10] sm:aspect-[2/1] lg:aspect-[2.3/1] rounded-xl lg:rounded-2xl overflow-hidden shadow-xl border border-slate-200 group">
                            <Image src={selectedRole === 'company' ? "/landing/platform-preview.png" : "/landing/register-provider.png"} alt="Contexto" fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#00213f]/80 via-transparent to-transparent flex items-end p-4 lg:p-5">
                              <Badge className="bg-primary-600 border-none font-bold text-[10px] sm:text-xs shadow-lg tracking-widest uppercase">UIAB Conecta</Badge>
                            </div>
                          </div>

                          <Button type="button" onClick={nextStep} className="w-full h-12 lg:h-13 bg-[#00213f] hover:bg-black text-white font-black text-base lg:text-lg rounded-xl transition-all active:scale-[0.98]">
                            Continuar y armar mi perfil <ArrowRight className="ml-3 h-5 w-5" />
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
                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de organización *</FormLabel>
                                    <FormControl>
                                      <BuscadorLista
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        items={[
                                          { value: 'empresa', label: 'Empresa / Industria' },
                                          { value: 'comercio', label: 'Comercio Minorista/Mayorista' },
                                          { value: 'entidad_financiera', label: 'Entidad financiera' },
                                          { value: 'cooperativa', label: 'Cooperativa / Mutual' },
                                          { value: 'educacion', label: 'Entidad educativa / Capacitación' },
                                          { value: 'institucion', label: 'Institución / Organización' },
                                          { value: 'gastronomia', label: 'Gastronomía y Alimentos' },
                                          { value: 'salud', label: 'Salud y Estética' },
                                          { value: 'servicios_generales', label: 'Servicios Generales' },
                                        ]}
                                        placeholder="Selecciona tipo..."
                                        searchPlaceholder="Buscar tipo..."
                                      />
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
                                <FormField control={form.control} name="nombreComercial" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nombre Comercial</FormLabel>
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
                                      <BuscadorLista
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        items={[
                                          { value: 'empresa', label: 'Empresa de Servicios' },
                                          { value: 'profesional_independiente', label: 'Profesional Independiente' },
                                          { value: 'monotributista', label: 'Monotributista / Oficio' },
                                          { value: 'particular', label: 'Particular' },
                                        ]}
                                        placeholder="Selecciona tipo..."
                                        searchPlaceholder="Buscar tipo..."
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                      {/* Sin type="url": el browser bloqueaba el paso con su cartel
                                          nativo "Introduce una URL" cuando faltaba el https://.
                                          El esquema lo agrega normalizarSitioWeb() al salir del campo. */}
                                      <Input
                                        placeholder="www.ejemplo.com"
                                        inputMode="url"
                                        className="h-14 pl-11 font-semibold text-base border-slate-200 focus:ring-primary-100 focus:border-primary-400 bg-white"
                                        {...field}
                                        onBlur={(e) => {
                                          field.onBlur()
                                          const normalizado = normalizarSitioWeb(e.target.value) ?? ''
                                          if (normalizado !== e.target.value) {
                                            form.setValue('sitioWeb', normalizado, { shouldValidate: true })
                                          }
                                        }}
                                      />
                                    </div>
                                  </FormControl>
                                  <p className="text-[11px] text-slate-400 font-medium ml-1">Podés escribirlo sin https://, lo completamos nosotros.</p>
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
                              {/* Provincia y Localidad salen de listas, no de texto libre:
                                  eran los dos únicos campos de ubicación escritos a mano y
                                  por eso el padrón terminó con "Longchgamps", "BURZACO",
                                  "ADROGUE" y "CABA" conviviendo con los nombres canónicos
                                  (item 3.1). El resto del sistema ya usaba listas cerradas. */}
                              <FormField control={form.control} name="provincia" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Provincia *</FormLabel>
                                  <FormControl>
                                    <BuscadorLista
                                      value={field.value}
                                      onChange={(v) => form.setValue('provincia', v, { shouldValidate: true })}
                                      items={PROVINCIAS_AR.map((p) => ({ value: p, label: p }))}
                                      placeholder="Elegí tu provincia"
                                      searchPlaceholder="Buscar provincia…"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <FormField control={form.control} name="localidad" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Localidad/Partido *</FormLabel>
                                  <FormControl>
                                    <BuscadorLista
                                      value={field.value}
                                      onChange={(v) => form.setValue('localidad', v, { shouldValidate: true })}
                                      items={LOCALIDADES_ALMIRANTE_BROWN.map((l) => ({ value: l, label: l }))}
                                      placeholder="Elegí tu localidad"
                                      searchPlaceholder="Buscar o escribir otra…"
                                      permitirOtro
                                    />
                                  </FormControl>
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
                                    className="flex w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] resize-none font-inter text-base focus:ring-primary-100"
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
                            <FormField control={form.control} name="sectorId" render={() => (
                              <FormItem>
                                <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoría</FormLabel>
                                <FormControl>
                                  <BuscadorJerarquico
                                    categorias={categorias}
                                    value={form.watch('sectorId')}
                                    onChange={(id, nombre) => {
                                      form.setValue('sectorId', id, { shouldValidate: true });
                                      form.setValue('subSector', nombre || 'general', { shouldValidate: true });
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />

                            {selectedRole === 'company' ? (
                              <FormField control={form.control} name="size" render={({ field }) => (
                                <FormItem className="pt-2">
                                  <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    Cantidad de Empleados *
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                      <Input
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        placeholder="Ej: 50"
                                        className="h-14 pl-11 font-semibold text-base border-slate-200 bg-white"
                                        {...field}
                                        onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                                      />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-[10px] text-slate-400 font-inter mt-2 ml-1 leading-relaxed">
                                    Tu tarifa se calcula por cantidad de empleados y la verás en el paso siguiente.
                                  </p>
                                </FormItem>
                              )} />
                            ) : (
                              <FormField control={form.control} name="experience" render={({ field }) => (
                                <FormItem className="pt-2">
                                  <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                                    Años de Experiencia
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                      <Input placeholder="Ej: 15 años" className="h-14 pl-11 font-semibold text-base border-slate-200 bg-white" {...field} />
                                    </div>
                                  </FormControl>
                                </FormItem>
                              )} />
                            )}
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
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="flex min-h-11 items-center px-2 -mr-2 text-xs font-bold text-primary-600 uppercase hover:underline">
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
                                        <div key={i} className={cn("h-full flex-1 transition-all duration-500", passStrength >= i * 25 ? getStrengthColor(passStrength) : "bg-transparent")} />
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

                      {/* ─── PHASE 7: SUSCRIPCIÓN (plan único UIAB Conecta) ─── */}
                      {step === 7 && (() => {
                        const esEmpresa = selectedRole === 'company';
                        const beneficios = esEmpresa
                          ? [
                            'Ficha institucional en el directorio oficial UIAB',
                            'Recepción de cotizaciones y consultas de empresas socias',
                            'Publicación de productos, servicios y oportunidades',
                            'Acceso a capacitaciones, eventos y convenios UIAB',
                            'Panel de métricas de interacciones y leads',
                            'Soporte prioritario del equipo UIAB Conecta',
                          ]
                          : [
                            'Perfil de particular/profesional en el directorio UIAB',
                            'Visibilidad ante empresas socias que buscan servicios',
                            'Publicación ilimitada de servicios y especialidades',
                            'Postulación a oportunidades publicadas por empresas',
                            'Acceso a eventos y capacitaciones abiertas UIAB',
                          ];
                        return (
                          <div className="space-y-3">
                            <div className="space-y-0.5">
                              <Badge className="bg-primary-50 text-primary-600 border-none font-bold px-2 py-0.5 text-[10px] tracking-widest uppercase rounded-sm">Membresía Oficial</Badge>
                              <h2 className="text-2xl font-black text-[#00213f] tracking-tighter" style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}>Tu suscripción.</h2>
                              <p className="text-slate-500 font-inter text-xs">
                                Una sola membresía para acceder a toda la red UIAB Conecta, igual para empresas y particulares.
                              </p>
                            </div>

                            {/* Plan único — tarjeta compacta */}
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                              {/* Header */}
                              <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #00213f 0%, #10375c 100%)' }}>
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg bg-white/10 border border-white/15">
                                    <Rocket className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/50">Plan asignado</p>
                                    <h3 className="text-base font-black text-white leading-tight">UIAB Conecta</h3>
                                  </div>
                                </div>
                                {/* Mostramos el ciclo que eligió en la landing para
                                    que el precio no le cambie de golpe acá. */}
                                <div className="text-right">
                                  <span className="text-2xl font-black text-white tracking-tighter">
                                    ${(cicloElegido === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL).toLocaleString('es-AR')}
                                  </span>
                                  <span className="text-xs text-white/60 ml-1">
                                    {cicloElegido === 'anual' ? '/ año' : '/ mes'}
                                  </span>
                                </div>
                              </div>

                              {/* Beneficios — grid 2 cols */}
                              <div className="px-5 py-4 bg-[#f7f9fb]">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">Qué incluye</p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                  {beneficios.map((b, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <div className="h-4 w-4 shrink-0 rounded-full bg-primary-600 flex items-center justify-center mt-0.5">
                                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-700 leading-snug">{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Footer total */}
                              <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between">
                                <div>
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                    {cicloElegido === 'anual' ? 'Total anual' : 'Total mensual'}
                                  </p>
                                  <p className="text-lg font-black text-[#00213f] tracking-tighter">
                                    ${(cicloElegido === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL).toLocaleString('es-AR')}{' '}
                                    <span className="text-xs font-semibold text-slate-400">
                                      {cicloElegido === 'anual' ? '/ año' : '/ mes'}
                                    </span>
                                  </p>
                                </div>
                                <p className="text-[10px] font-semibold text-slate-400">
                                  {cicloElegido === 'anual' ? 'Un pago al año · 2 meses bonificados' : 'Mes a mes · sin permanencia'}
                                </p>
                              </div>
                            </div>

                            {/* Aclaración: pago anual y cortesía para socias UIAB */}
                            <div className="rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 space-y-1.5">
                              <p className="text-xs font-semibold text-[#00213f] flex items-start gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-primary-600 shrink-0 mt-0.5" />
                                <span>
                                  {cicloElegido === 'anual' ? (
                                    <>Si preferís, también podés pagar mes a mes por <span className="font-black">${PRECIO_MENSUAL.toLocaleString('es-AR')}</span>.</>
                                  ) : (
                                    <>También podés pagar el año completo por <span className="font-black">${PRECIO_ANUAL.toLocaleString('es-AR')}</span>.</>
                                  )}
                                </span>
                              </p>
                              <p className="text-xs font-semibold text-[#00213f] flex items-start gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-primary-600 shrink-0 mt-0.5" />
                                <span>¿Ya sos socia de la UIAB? Tu acceso es sin cargo.</span>
                              </p>
                            </div>

                            <div className="space-y-2 pt-1">
                              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-black text-base rounded-xl shadow-xl shadow-primary-600/20 transition-all active:scale-[0.98]">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Finalizar y continuar al pago <ArrowRight className="ml-2 h-4 w-4" /></>}
                              </Button>
                              {/* Bypass de MercadoPago para probar el alta de punta a punta.
                                  NUNCA en producción: deja la entidad aprobada y la suscripción
                                  activa de cortesía, así que era la puerta por la que un no socio
                                  se daba de alta con funcionalidad plena sin abonar el canon
                                  (item 1.2 del reporte de Lucas). */}
                              {process.env.NODE_ENV !== 'production' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isLoading}
                                  onClick={async () => {
                                    form.setValue('plan', 'gratis_test');
                                    await form.handleSubmit(onSubmit)();
                                  }}
                                  className="w-full h-10 border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                                >
                                  Acceso gratis (solo para pruebas · dev)
                                </Button>
                              )}
                              <p className="text-center text-[10px] text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                                Al continuar, se crea tu cuenta. Recibirás un email para confirmar tu correo.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

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

function BuscadorLista({
  value,
  onChange,
  items,
  placeholder,
  searchPlaceholder,
  permitirOtro = false,
}: {
  value: string;
  onChange: (v: string) => void;
  items: Array<{ value: string; label: string }>;
  placeholder: string;
  searchPlaceholder: string;
  /**
   * Deja usar un valor que no está en la lista, con lo que el socio escribió en
   * el buscador. Lo necesita Localidad: la lista son las 12 del partido de
   * Almirante Brown (el alcance del directorio) pero al registro se anota
   * cualquiera, así que una empresa de otro partido tiene que poder cargar la
   * suya. Antes el campo era texto libre y por eso terminó guardado
   * "Longchgamps" — el typo que después el select del perfil devolvía como
   * opción propia (item 3.1 del reporte de Lucas).
   */
  permitirOtro?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Un valor fuera de lista se muestra igual (si no, el campo se veía vacío
  // aunque tuviera dato cargado).
  const enLista = items.find((i) => i.value === value);
  const seleccionado = enLista ?? (value ? { value, label: value } : undefined);

  const q = query.trim().toLowerCase();
  const filtrados = q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items;
  const textoOtro = query.trim();
  const ofrecerOtro =
    permitirOtro &&
    textoOtro.length >= 2 &&
    !items.some((i) => i.label.toLowerCase() === q);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none items-center justify-between text-left"
      >
        <span className={cn('truncate', !seleccionado && 'text-slate-400 font-semibold')}>
          {seleccionado ? seleccionado.label : placeholder}
        </span>
        <span className="ml-2 text-slate-400 shrink-0 flex items-center gap-1">
          {value && (
            <X
              className="h-9 w-9 -mr-1 p-2.5 hover:text-rose-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setQuery('');
              }}
            />
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-2 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {filtrados.length === 0 && !ofrecerOtro ? (
              <div className="p-4 text-center text-xs text-slate-500">Sin coincidencias.</div>
            ) : (
              <>
                {filtrados.map((i) => (
                  <button
                    key={i.value}
                    type="button"
                    onClick={() => {
                      onChange(i.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors',
                      value === i.value && 'bg-primary-50 text-primary-700 font-bold'
                    )}
                  >
                    {i.label}
                  </button>
                ))}
                {ofrecerOtro && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(textoOtro);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm border-t border-slate-100 hover:bg-primary-50 transition-colors text-slate-600"
                  >
                    Usar <span className="font-bold text-[#00213f]">“{textoOtro}”</span>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      No está en la lista del partido de Almirante Brown
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type CategoriaDB = { id: string; nombre: string; categoria_padre_id: string | null };

function BuscadorJerarquico({
  categorias,
  value,
  onChange,
}: {
  categorias: CategoriaDB[];
  value: string;
  onChange: (categoriaId: string, nombre: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const seleccionada = categorias.find((c) => c.id === value);
  const padreDe = (c: { categoria_padre_id: string | null }) =>
    c.categoria_padre_id ? categorias.find((x) => x.id === c.categoria_padre_id) : null;

  const q = query.trim().toLowerCase();
  const filtradas = q
    ? categorias.filter((c) => {
      const padre = padreDe(c);
      return (
        c.nombre.toLowerCase().includes(q) ||
        (padre?.nombre.toLowerCase().includes(q) ?? false)
      );
    })
    : categorias;

  const raices = filtradas.filter((c) => !c.categoria_padre_id);
  const hijasDe = (id: string) => filtradas.filter((c) => c.categoria_padre_id === id);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full h-12 rounded-lg border border-slate-200 bg-white px-4 text-base font-bold text-[#00213f] focus:ring-4 focus:ring-primary-50 transition-all cursor-pointer shadow-sm outline-none items-center justify-between text-left"
      >
        <span className={cn('truncate', !seleccionada && 'text-slate-400 font-semibold')}>
          {seleccionada ? seleccionada.nombre : 'Seleccioná una categoría'}
        </span>
        <span className="ml-2 text-slate-400 shrink-0 flex items-center gap-1">
          {value ? (
            <X
              className="h-9 w-9 -mr-1 p-2.5 hover:text-rose-600"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
                setQuery('');
              }}
            />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                className="w-full pl-8 pr-2 py-2 text-base bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Buscar categoría..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {raices.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">Sin coincidencias.</div>
            )}
            {raices.map((raiz) => {
              const hijas = hijasDe(raiz.id);
              return (
                <div key={raiz.id} className="py-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50">
                    {raiz.nombre}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(raiz.id, raiz.nombre);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-sm hover:bg-primary-50 flex items-center gap-2',
                      value === raiz.id && 'bg-primary-50 text-primary-700 font-semibold'
                    )}
                  >
                    <span className="text-slate-400 text-xs">—</span>
                    General
                  </button>
                  {hijas.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => {
                        onChange(h.id, h.nombre);
                        setOpen(false);
                        setQuery('');
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-sm hover:bg-primary-50 flex items-center gap-2',
                        value === h.id && 'bg-primary-50 text-primary-700 font-semibold'
                      )}
                    >
                      <span className="text-slate-300 text-xs ml-2">↳</span>
                      {h.nombre}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-svh flex items-center justify-center font-bold text-[#00213f] animate-pulse">Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  )
}
