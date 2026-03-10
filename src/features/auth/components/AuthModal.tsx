"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Building, Wrench } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import { mockAdmin, mockedCompanies, mockedProviders } from "@/features/shared/data/mockDB";
import { Button } from "@/components/ui/button";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Ingresar a Conectar-UIAB</h2>
            <Button variant="ghost" size="icon" onClick={closeAuthModal}>
              <X className="h-5 w-5 text-slate-500" />
            </Button>
          </div>

          <div className="p-6">
            <p className="text-slate-600 mb-6 text-sm">
              Para propósitos de demostración, selecciona con qué perfil deseas iniciar sesión:
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-14 text-left font-normal"
                onClick={handleLoginAdmin}
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Administrador UIAB</div>
                  <div className="text-xs text-slate-500">Acceso total para moderar usuarios</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 text-left font-normal"
                onClick={handleLoginCompany}
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Empresa Socia</div>
                  <div className="text-xs text-slate-500">Puede buscar y reseñar proveedores</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-14 text-left font-normal"
                onClick={handleLoginProvider}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mr-3">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Proveedor de Servicio</div>
                  <div className="text-xs text-slate-500">Maneja su perfil público y solicitudes</div>
                </div>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
