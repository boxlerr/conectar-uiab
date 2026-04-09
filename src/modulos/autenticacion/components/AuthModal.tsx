"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Supabase Browser Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Error de acceso", { description: error.message });
        setIsLoading(false);
        return;
      }

      toast.success("Bienvenido de nuevo");
      await refreshUser();
      closeAuthModal();
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.error("Error del sistema", { description: err.message || "Contacte a soporte." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegister = () => {
    closeAuthModal();
    router.push("/register");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Backdrop — tinted shadow per DESIGN.md */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : closeAuthModal}
          className="absolute inset-0 bg-[#191c1e]/40 backdrop-blur-md"
        />

        {/* Modal — Ambient shadow: on_surface 6% opacity, blur 32px, Y-offset 16px */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[440px] max-h-[90vh] overflow-y-auto overflow-hidden"
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
            {/* Dot grid texture — matching hero */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)",
              backgroundSize: "32px 32px",
            }} />
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-400/[0.06] blur-[80px]" />

            {/* Close — Tertiary/Ghost: No background, primary text, no borders */}
            <button 
              onClick={closeAuthModal} 
              disabled={isLoading}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative z-10 flex items-center gap-3">
              <div 
                className="w-10 h-10 bg-white/[0.08] backdrop-blur-xl flex items-center justify-center"
                style={{ borderRadius: "0.25rem" }}
              >
                <Image 
                  src="/logo-prueba.png" 
                  alt="UIAB Logo" 
                  width={26} 
                  height={26}
                  className="object-contain brightness-0 invert"
                />
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
              
              {/* Email Input — DESIGN.md: Large padding, surface_container_low bg, ghost border on focus */}
              <div className="space-y-2 text-left">
                <label 
                  className="text-[11px] font-bold text-[#191c1e]/50 tracking-[0.08em] uppercase ml-0.5"
                  style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                >
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#191c1e]/30 group-focus-within:text-[#00213f] transition-colors">
                    <Mail className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-12 w-full bg-[#f2f4f6] px-4 py-3 pl-12 text-[15px] font-semibold text-[#191c1e] placeholder:text-[#191c1e]/30 placeholder:font-normal focus:bg-white focus:outline-none transition-all"
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
                <label 
                  className="text-[11px] font-bold text-[#191c1e]/50 tracking-[0.08em] uppercase ml-0.5"
                  style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                >
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#191c1e]/30 group-focus-within:text-[#00213f] transition-colors">
                    <Lock className="h-[18px] w-[18px]" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex h-12 w-full bg-[#f2f4f6] px-4 py-3 pl-12 pr-12 text-[15px] font-semibold text-[#191c1e] placeholder:text-[#191c1e]/30 placeholder:font-normal focus:bg-white focus:outline-none transition-all tracking-wider"
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
                  {/* Show/hide — Tertiary/Ghost: no bg, no border */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#191c1e]/25 hover:text-[#191c1e]/60 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Primary CTA — DESIGN.md: solid primary bg, on_primary text, DEFAULT roundedness */}
              <Button 
                type="submit" 
                className="w-full h-12 text-[14px] font-bold bg-[#00213f] hover:bg-[#10375c] text-white active:scale-[0.98] transition-all cursor-pointer"
                style={{ borderRadius: "0.25rem" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Ingresar al Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* ── REGISTER SECTION — separated by background shift, no 1px borders ── */}
            <div 
              className="mt-6 -mx-8 -mb-7 px-8 py-6 bg-[#f7f9fb]"
            >
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
                onClick={handleGoToRegister}
                className="w-full h-11 bg-white hover:bg-[#00213f] text-[#00213f] hover:text-white text-[13px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] group"
                style={{ 
                  borderRadius: "0.25rem",
                  boxShadow: "0 1px 3px rgba(0,33,63,0.04)",
                }}
              >
                <ShieldCheck className="w-4 h-4 text-primary-600 group-hover:text-white transition-colors" />
                Registrate como Proveedor o Empresa
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
