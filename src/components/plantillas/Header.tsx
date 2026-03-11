"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Shield, Building, Wrench, Menu, X, Mail, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

interface HeaderProps {
  currentUser: UserType | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function Header({ currentUser, onLoginClick, onLogout }: HeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Inicio", href: "/", icon: null },
    { name: "Nosotros", href: "https://www.uiab.org", icon: Info, external: true },
    { name: "Empresas", href: "/empresas", icon: Building },
    { name: "Proveedores", href: "/proveedores", icon: Wrench },
    { name: "Contacto", href: "/contacto", icon: Mail },
  ];

  if (currentUser?.role === "admin") {
    navigation.push({ name: "Panel Admin", href: "/admin", icon: Shield });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">UIAB</span>
            </div>
            <Link href="/" className="font-bold text-xl text-slate-900 tracking-tight hidden sm:block">
              Conectar<span className="text-primary-600">UIAB</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors flex items-center gap-1.5",
                    isActive
                      ? "text-primary-600"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="font-medium">{currentUser.name}</span>
                </div>
                <Button variant="outline" size="sm" onClick={onLogout}>
                  Salir
                </Button>
              </div>
            ) : (
              <Button onClick={onLoginClick} className="gap-2">
                <User className="w-4 h-4" />
                Ingresar
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-base font-medium flex items-center gap-2",
                    isActive
                      ? "bg-primary-50 text-primary-600"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {item.name}
                </Link>
              );
            })}
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              {currentUser ? (
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-slate-900">{currentUser.name}</span>
                  <Button variant="outline" size="sm" onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}>
                    Salir
                  </Button>
                </div>
              ) : (
                <Button className="w-full justify-center" onClick={() => { onLoginClick(); setIsMobileMenuOpen(false); }}>
                  Ingresar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
