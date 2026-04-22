'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/cliente'
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
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const translatedMessage = error.message === "Invalid login credentials" 
          ? "El correo electrónico o la contraseña son incorrectos." 
          : error.message;
          
        toast.error("Error de acceso", { description: translatedMessage });
        setIsLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('perfiles')
        .select('rol_sistema')
        .eq('id', data.user.id)
        .single()

      toast.success('Acceso exitoso', {
        description: 'Redirigiendo a tu panel...',
      })

      if (redirectParams) {
        router.push(redirectParams)
      } else {
        const rol = profile?.rol_sistema
        if (rol === 'admin') router.push('/admin')
        else if (rol === 'company') router.push('/dashboard')
        else router.push('/dashboard')
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
    <div className="flex min-h-screen items-center justify-center bg-[#f2f4f6] p-4 sm:p-6 overflow-hidden relative">
      <div 
        className="relative w-full max-w-[440px] overflow-hidden z-10 bg-white"
        style={{ 
          borderRadius: "0.25rem",
          boxShadow: "0 16px 32px rgba(25, 28, 30, 0.06)",
        }}
      >
        {/* ── HEADER — Gradient primary → primary_container at 135° ── */}
        <div 
          className="relative px-8 pt-7 pb-6 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #00213f 0%, #10375c 100%)" }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
            backgroundSize: "32px 32px",
          }} />
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-400/[0.06] blur-[80px]" />

          <div className="relative z-10 flex items-center gap-3">
            <div 
              className="w-10 h-10 bg-white/[0.08] backdrop-blur-xl flex items-center justify-center"
              style={{ borderRadius: "0.25rem" }}
            >
              {/* Fallback to text if Image not imported here */}
              <div className="text-white font-bold text-xl">U</div>
            </div>
            <div>
              <span 
                className="text-[10px] font-bold text-white/40 tracking-[0.14em] uppercase block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                UIAB Conecta
              </span>
              <h2 
                className="text-xl font-bold text-white tracking-tight leading-none mt-0.5"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Iniciar Sesión
              </h2>
            </div>
          </div>
        </div>

        {/* ── FORM CONTENT — surface_container_lowest (#ffffff) ── */}
        <div className="bg-white px-8 py-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div className="space-y-2 text-left">
              <label 
                className="text-[11px] font-bold text-[#191c1e]/80 tracking-[0.08em] uppercase ml-0.5"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Correo Electrónico
              </label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-12 w-full bg-[#f2f4f6] px-4 py-3 pl-4 text-[15px] font-semibold text-[#191c1e] placeholder:text-[#191c1e]/30 placeholder:font-normal focus:bg-white focus:outline-none transition-all"
                  style={{ 
                    borderRadius: "0.25rem",
                    boxShadow: "none",
                    border: "1.5px solid transparent",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid rgba(0,33,63,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1.5px solid transparent";
                  }}
                  placeholder="correo@empresa.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between ml-0.5">
                <label 
                  className="text-[11px] font-bold text-[#191c1e]/80 tracking-[0.08em] uppercase"
                  style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                >
                  Contraseña
                </label>
                <Link 
                  href="/recovery" 
                  className="text-[10px] font-bold text-[#00213f]/60 hover:text-[#00213f] transition-colors uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full bg-[#f2f4f6] px-4 py-3 pl-4 pr-12 text-[15px] font-semibold text-[#191c1e] placeholder:text-[#191c1e]/30 placeholder:font-normal focus:bg-white focus:outline-none transition-all tracking-wider"
                  style={{ 
                    borderRadius: "0.25rem",
                    boxShadow: "none",
                    border: "1.5px solid transparent",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid rgba(0,33,63,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1.5px solid transparent";
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#191c1e]/25 hover:text-[#191c1e]/60 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  <span className="text-xs font-semibold">{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-[14px] font-bold bg-[#00213f] hover:bg-[#10375c] text-white active:scale-[0.98] transition-all cursor-pointer"
              style={{ borderRadius: "0.25rem" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Ingresar al Portal'
              )}
            </Button>
          </form>

          {/* ── REGISTER SECTION ── */}
          <div className="mt-6 -mx-8 -mb-7 px-8 py-6 bg-[#f7f9fb]">
            <p 
              className="text-[13px] text-[#191c1e]/50 text-center mb-3 leading-relaxed"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              ¿Es tu primera vez en{" "}
              <span className="font-bold text-[#191c1e]">UIAB Conecta</span>?
            </p>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => router.push("/register")}
              className="w-full h-11 bg-white hover:bg-[#00213f] text-[#00213f] hover:text-white text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] group"
              style={{ 
                borderRadius: "0.25rem",
                boxShadow: "0 1px 3px rgba(0,33,63,0.04)",
              }}
            >
              Registrate como Socio o Proveedor
            </button>
          </div>
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
