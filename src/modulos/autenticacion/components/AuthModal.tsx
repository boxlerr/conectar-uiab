"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Building, Wrench, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";
import { useAuth } from "@/modulos/autenticacion/AuthContext";
import { mockAdmin, mockedCompanies, mockedProviders } from "@/modulos/compartido/data/mockDB";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Reusable Input Component for the form
const FormInput = ({ 
  icon: Icon, 
  label, 
  type = "text", 
  placeholder 
}: { 
  icon: React.ElementType, 
  label: string, 
  type?: string, 
  placeholder?: string 
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <input
        type={type}
        className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-10 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
        placeholder={placeholder}
      />
    </div>
  </div>
);

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<"company" | "provider">("company");

  if (!isAuthModalOpen) return null;

  const handleLoginAdmin = () => login(mockAdmin);
  const handleLoginCompany = () => login({
    id: mockedCompanies[0].id,
    name: mockedCompanies[0].name,
    email: mockedCompanies[0].contactEmail,
    role: "company",
    isMember: true,
  });
  const handleLoginProvider = () => login({
    id: mockedProviders[0].id,
    name: mockedProviders[0].name,
    email: mockedProviders[0].contactEmail,
    role: "provider",
    isMember: false,
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for real form by just logging in as company for now
    handleLoginCompany();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl overflow-hidden scrollbar-hide"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <Button variant="ghost" size="icon" onClick={closeAuthModal} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4 text-slate-500" />
            </Button>
          </div>

          <div className="p-6">
            {/* Logo / Brand area (optional, keep it clean) */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <span className="text-white font-bold text-xl">UIAB</span>
              </div>
            </div>

            {/* Forms with Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleDemoSubmit} className="space-y-4">
                  {!isLogin && (
                    <FormInput icon={UserIcon} label="Nombre completo / Empresa" placeholder="Juan Pérez" />
                  )}
                  
                  <FormInput icon={Mail} label="Correo Electrónico" type="email" placeholder="correo@ejemplo.com" />
                  <FormInput icon={Lock} label="Contraseña" type="password" placeholder="••••••••" />
                  
                  {!isLogin && (
                    <div className="space-y-2 pt-1">
                      <label className="text-sm font-medium text-slate-700">Tipo de Cuenta</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRole("company")}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 border rounded-xl transition-all duration-200",
                            selectedRole === "company" 
                              ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600" 
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <Building className={cn("w-5 h-5 mb-1", selectedRole === "company" ? "text-primary-600" : "text-slate-400")} />
                          <span className="text-xs font-semibold">Empresa Socia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole("provider")}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 border rounded-xl transition-all duration-200",
                            selectedRole === "provider" 
                              ? "border-primary-600 bg-primary-50 text-primary-700 ring-1 ring-primary-600" 
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <Wrench className={cn("w-5 h-5 mb-1", selectedRole === "provider" ? "text-primary-600" : "text-slate-400")} />
                          <span className="text-xs font-semibold">Proveedor</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isLogin && (
                    <div className="flex justify-end">
                      <button type="button" className="text-xs text-primary-600 font-medium hover:text-primary-700 hover:underline">
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-11 text-base font-medium mt-2 shadow-md">
                    {isLogin ? "Ingresar a mi cuenta" : "Registrarme"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </motion.div>
            </AnimatePresence>

            {/* Toggle Login/Register */}
            <div className="mt-6 text-center text-sm text-slate-600">
              {isLogin ? "¿No tienes una cuenta aún?" : "¿Ya tienes una cuenta?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors focus:outline-none"
              >
                {isLogin ? "Regístrate aquí" : "Inicia sesión"}
              </button>
            </div>

            {/* Divider */}
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-500 bg-slate-50 rounded-full border border-slate-100 py-1">
                  Cuentas de prueba (Demo)
                </span>
              </div>
            </div>

            {/* Demo Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleLoginCompany}
                className="w-full group flex items-center p-3 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-900">Empresa Socia</div>
                  <div className="text-xs text-slate-500 line-clamp-1">Acceso para buscar y reseñar proveedores</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLoginProvider}
                className="w-full group flex items-center p-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-900">Proveedor de Servicio</div>
                  <div className="text-xs text-slate-500 line-clamp-1">Maneja tu perfil público y solicitudes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLoginAdmin}
                className="w-full group flex items-center p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform text-slate-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Administrador UIAB</div>
                  <div className="text-xs text-slate-500 line-clamp-1">Acceso total para moderar la plataforma</div>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
