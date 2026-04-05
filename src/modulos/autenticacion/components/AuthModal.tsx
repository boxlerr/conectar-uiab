"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { Button } from "@/components/ui/button";

// Reusable Input Component for the form
const FormInput = ({ 
  icon: Icon, 
  label, 
  type = "text", 
  placeholder,
  value,
  onChange,
  required = true
}: { 
  icon: React.ElementType, 
  label: string, 
  type?: string, 
  placeholder?: string,
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  required?: boolean
}) => (
  <div className="space-y-1.5 text-left">
    <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="flex h-11 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 pl-10 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm focus:bg-white"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  
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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isLoading ? undefined : closeAuthModal}
          className="absolute inset-0 bg-[#00213f]/40 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl overflow-hidden border border-[#d8dadc]/50"
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image 
                  src="/logo-prueba.png" 
                  alt="UIAB Logo" 
                  width={34} 
                  height={34}
                  className="object-contain"
                />
              </div>
              <h2 className="text-lg font-bold text-[#00213f] tracking-tight">Acceso Industrial</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeAuthModal} 
              disabled={isLoading}
              className="h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormInput 
                icon={Mail} 
                label="Correo Electrónico" 
                type="email" 
                placeholder="correo@industria.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <FormInput 
                icon={Lock} 
                label="Contraseña" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-bold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 active:scale-[0.98] transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar al Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Link to /register */}
            <div className="mt-8 text-center text-sm text-slate-500">
              ¿Es tu primera vez en UIAB?{" "}
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoToRegister}
                className="font-bold text-primary-600 hover:text-primary-700 hover:underline transition-colors cursor-pointer"
              >
                Registra tu industria
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
