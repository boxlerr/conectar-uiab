"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Shield, Building, Wrench, Menu, X, Mail, Info, ChevronRight, LogOut, Briefcase, BookOpen, GraduationCap, Landmark, Package, Users } from "lucide-react";
import { cn } from "@/lib/utilidades";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import type { User as UserType } from "@/tipos";

interface HeaderProps {
  currentUser: UserType | null;
  onLogout: () => Promise<void>;
}

import { ChevronDown, Sparkles, Loader2 } from "lucide-react";

function ProfileDropdownMenu({ currentUser, onLogout }: { currentUser: UserType, onLogout: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/50 backdrop-blur-sm border border-slate-200/50 pl-2 pr-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:bg-white transition-all group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-100 to-indigo-100 flex items-center justify-center text-primary-700 font-bold shadow-inner uppercase">
            {currentUser.name.charAt(0)}
          </div>
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
        </div>
        <span className="text-sm font-semibold text-slate-800 max-w-[120px] truncate">
          {currentUser.name.split(' ')[0]}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right"
          >
            <div className="p-3 bg-slate-50/50 border-b border-slate-100">
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Conectado como</p>
               <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
               <p className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-0.5">
                 <Sparkles className="w-3 h-3 text-emerald-500" />
                 {currentUser.role === 'company' ? 'Empresa' : currentUser.role === 'provider' ? 'Proveedor' : 'Admin'}
               </p>
            </div>
            
            <div className="p-1">
              {currentUser.role !== 'admin' && (
                <Link 
                  href="/perfil" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4" />
                  Mi Perfil / Panel
                </Link>
              )}
              {currentUser.role === 'admin' && (
                <Link 
                  href="/admin" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Panel Admin
                </Link>
              )}
              <button
                disabled={isLoggingOut}
                onClick={async () => {
                  if (isLoggingOut) return;
                  setIsLoggingOut(true);
                  setIsOpen(false);
                  await onLogout();
                  setIsLoggingOut(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <LogOut className="w-4 h-4" />
                }
                {isLoggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ currentUser, onLogout }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategoria = searchParams.get("categoria");

  // Compara un href (ej. "/empresas?categoria=educativas") contra
  // pathname+query actuales para decidir si está activo.
  const hrefEsActivo = (href: string) => {
    const [hrefPath, hrefQuery] = href.split("?");
    if (pathname !== hrefPath) return false;
    if (!hrefQuery) return !currentCategoria;
    const hrefParams = new URLSearchParams(hrefQuery);
    const hrefCategoria = hrefParams.get("categoria");
    return hrefCategoria === currentCategoria;
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  type NavChild = {
    name: string;
    href: string;
    icon: typeof Building;
    description?: string;
  };
  type NavGroup = {
    name: string;
    icon: typeof Building;
    description?: string;
    items: NavChild[];
  };
  type NavItem = {
    name: string;
    href: string;
    icon: typeof Building | null;
    external?: boolean;
    children?: NavChild[];
    groups?: NavGroup[];
  };

  const navigation: NavItem[] = [
    { name: currentUser ? "Dashboard" : "Inicio", href: currentUser ? "/dashboard" : "/", icon: null },
    {
      name: "Directorio",
      href: "/directorio",
      icon: BookOpen,
      groups: [
        {
          name: "Socios UIAB",
          icon: Building,
          description: "Miembros verificados de la institución",
          items: [
            {
              name: "Proveedores de servicios y productos",
              href: "/empresas?categoria=proveedores",
              icon: Package,
              description: "Empresas industriales socias",
            },
            {
              name: "Instituciones educativas",
              href: "/empresas?categoria=educativas",
              icon: GraduationCap,
              description: "Centros de formación aliados",
            },
            {
              name: "Instituciones bancarias",
              href: "/empresas?categoria=bancarias",
              icon: Landmark,
              description: "Entidades financieras socias",
            },
          ],
        },
        {
          name: "Directorio abierto",
          icon: Users,
          description: "Búsqueda general de servicios",
          items: [
            {
              name: "Particulares",
              href: "/proveedores",
              icon: Wrench,
              description: "Proveedores y servicios sin membresía",
            },
          ],
        },
      ],
    },
    { name: "Oportunidades", href: "/oportunidades", icon: Briefcase },
    { name: "Nosotros", href: "https://www.uiab.org", icon: null, external: true },
    { name: "Contacto", href: "/contacto", icon: null },
  ];

  if (currentUser?.role === "admin") {
    navigation.push({ name: "Panel Admin", href: "/admin", icon: Shield });
  }

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const navContainerRef = useRef<HTMLDivElement>(null);
  const [activePill, setActivePill] = useState({ left: 0, width: 0, opacity: 0 });
  const [hoverPill, setHoverPill] = useState({ left: 0, width: 0, opacity: 0 });

  // Update active pill position when pathname changes
  useEffect(() => {
    if (!navContainerRef.current) return;
    // Small timeout to ensure DOM is painted, though usually not needed
    const timeout = setTimeout(() => {
      if (!navContainerRef.current) return;
      const activeEl = navContainerRef.current.querySelector('[data-active="true"]') as HTMLElement;
      if (activeEl) {
        setActivePill({ left: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 });
      } else {
        setActivePill(prev => ({ ...prev, opacity: 0 }));
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [pathname]);

  const handleHover = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    setHoveredPath(path);
    setHoverPill({ left: e.currentTarget.offsetLeft, width: e.currentTarget.offsetWidth, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setHoveredPath(null);
    setHoverPill(prev => ({ ...prev, opacity: 0 }));
  };

  const activeIndex = navigation.findIndex(n => n.href === pathname);

  const { openAuthModal } = useAuth();

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b",
          scrolled 
            ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-slate-200/50" 
            : "bg-white/50 backdrop-blur-sm border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 flex items-center gap-2.5"
            >
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Image 
                    src="/logo-prueba.png" 
                    alt="UIAB Logo" 
                    width={44} 
                    height={44}
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="font-bold text-xl sm:text-2xl text-slate-900 tracking-tight hidden sm:flex items-center gap-1">
                  UIAB
                  <span className="text-primary-600">Conecta</span>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav 
              className="hidden md:flex relative items-center justify-center"
              onMouseLeave={handleMouseLeave}
            >
              <div ref={navContainerRef} className="flex relative bg-slate-100/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/50">
                
                {/* Active Pill (Animated by state to avoid layoutId bugs on scroll) */}
                <motion.div
                  initial={false}
                  animate={{ 
                    left: activePill.left, 
                    width: activePill.width, 
                    opacity: activePill.opacity 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-sm border border-slate-200/50"
                  style={{ zIndex: 0 }}
                />

                {/* Hover Pill */}
                <motion.div
                  initial={false}
                  animate={{ 
                    left: hoverPill.left, 
                    width: hoverPill.width, 
                    opacity: hoveredPath && hoveredPath !== pathname ? hoverPill.opacity : 0 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-1.5 bottom-1.5 bg-slate-200/50 rounded-xl"
                  style={{ zIndex: 1 }}
                />

                {navigation.map((item) => {
                  const allChildren = item.groups?.flatMap(g => g.items) ?? item.children ?? [];
                  const isActive = allChildren.length > 0
                    ? allChildren.some(c => hrefEsActivo(c.href))
                    : pathname === item.href;
                  const Icon = item.icon;

                  if (item.children || item.groups) {
                    const isOpen = openDropdown === item.name;
                    const hasGroups = !!item.groups;
                    return (
                      <div 
                        key={item.name} 
                        className="relative flex" 
                        ref={isOpen ? dropdownRef : undefined}
                        data-active={isActive}
                        onMouseEnter={(e) => handleHover(e as unknown as React.MouseEvent<HTMLAnchorElement>, item.href)}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(isOpen ? null : item.name)}
                          className={cn(
                            "relative px-4 py-2 text-sm font-semibold transition-colors duration-300 rounded-xl flex w-full items-center gap-2",
                            isActive ? "text-primary-700" : "text-slate-600 hover:text-slate-900"
                          )}
                          style={{ zIndex: 10 }}
                        >
                          {Icon && (
                            <Icon className={cn(
                              "w-4 h-4 transition-transform duration-300",
                              isActive ? "text-primary-600 scale-110" : "text-slate-400 opacity-70"
                            )} />
                          )}
                          <span>{item.name}</span>
                          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isOpen && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                              className={cn(
                                "absolute left-1/2 -translate-x-1/2 top-full mt-3 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top",
                                hasGroups ? "w-[22rem]" : "w-56"
                              )}
                            >
                              {hasGroups ? (
                                <div className="p-2 space-y-1">
                                  {item.groups!.map((group, gi) => {
                                    const GroupIcon = group.icon;
                                    return (
                                      <div key={group.name} className={cn(gi > 0 && "pt-2 mt-2 border-t border-slate-100")}>
                                        <div className="flex items-center gap-2 px-3 pt-1.5 pb-1">
                                          <div className="w-6 h-6 rounded-md bg-primary-50 flex items-center justify-center">
                                            <GroupIcon className="w-3.5 h-3.5 text-primary-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs font-bold text-slate-900 leading-tight">{group.name}</p>
                                            {group.description && (
                                              <p className="text-[10px] text-slate-500 leading-tight">{group.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                          {group.items.map((child) => {
                                            const ChildIcon = child.icon;
                                            const childActive = hrefEsActivo(child.href);
                                            return (
                                              <Link
                                                key={child.name}
                                                href={child.href}
                                                onClick={() => setOpenDropdown(null)}
                                                className={cn(
                                                  "w-full flex items-start gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors",
                                                  childActive
                                                    ? "bg-primary-50 text-primary-700"
                                                    : "text-slate-700 hover:text-primary-700 hover:bg-primary-50"
                                                )}
                                              >
                                                <ChildIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", childActive ? "text-primary-600" : "text-slate-400")} />
                                                <div className="min-w-0">
                                                  <p className="font-semibold leading-tight">{child.name}</p>
                                                  {child.description && (
                                                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{child.description}</p>
                                                  )}
                                                </div>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="p-1.5">
                                  {item.children!.map((child) => {
                                    const ChildIcon = child.icon;
                                    const childActive = pathname === child.href;
                                    return (
                                      <Link
                                        key={child.name}
                                        href={child.href}
                                        onClick={() => setOpenDropdown(null)}
                                        className={cn(
                                          "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors",
                                          childActive
                                            ? "bg-primary-50 text-primary-700"
                                            : "text-slate-700 hover:text-primary-700 hover:bg-primary-50"
                                        )}
                                      >
                                        <ChildIcon className={cn("w-4 h-4", childActive ? "text-primary-600" : "text-slate-400")} />
                                        {child.name}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-active={isActive}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className={cn(
                        "relative px-4 py-2 text-sm font-semibold transition-colors duration-300 rounded-xl flex items-center gap-2",
                        isActive ? "text-primary-700" : "text-slate-600 hover:text-slate-900"
                      )}
                      style={{ zIndex: 10 }}
                      onMouseEnter={(e) => handleHover(e, item.href)}
                    >
                      {Icon && (
                        <Icon className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          isActive ? "text-primary-600 scale-110" : "text-slate-400 opacity-70"
                        )} />
                      )}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Desktop Actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-4"
            >
              {currentUser ? (
                <div className="relative" onMouseLeave={() => setHoveredPath(null)}> 
                  {/* Keep the generic onMouseLeave to close custom menus if needed, or use a specific state */}
                  <ProfileDropdownMenu currentUser={currentUser} onLogout={onLogout} />
                </div>
              ) : (
                <Button 
                  onClick={openAuthModal}
                  className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl font-semibold bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20 transition-all hover:-translate-y-0.5 text-white"
                >
                  <User className="w-4 h-4" />
                  Ingresar
                </Button>
              )}
            </motion.div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="relative z-50 h-10 w-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* spacer to prevent content from going under the fixed header */}
      <div className="h-16 sm:h-20 w-full" />

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full pt-20 px-6 pb-6">
                
                {/* Mobile User Profile or Login */}
                <div className="mb-8">
                  {currentUser ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-100 to-indigo-100 flex items-center justify-center text-primary-700 font-bold shadow-inner text-lg uppercase">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{currentUser.name}</p>
                          <p className="text-xs font-medium text-slate-500 capitalize">{currentUser.role}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100/50 text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mx-auto shadow-sm text-primary-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Bienvenido</h3>
                        <p className="text-sm text-slate-500 mb-4">Ingresa a tu cuenta industrial</p>
                      </div>
                      <Link 
                        href="/login"
                        className="inline-flex items-center justify-center w-full font-semibold shadow-md bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2 px-4 transition-colors" 
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Iniciar Sesión
                      </Link>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Navegación</h4>
                  {navigation.map((item, i) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        {item.children || item.groups ? (
                          <div>
                            <div className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                              {Icon && <Icon className="w-4 h-4" />}
                              {item.name}
                            </div>
                            <div className="space-y-2 pl-2">
                              {(item.groups
                                ? item.groups
                                : [{ name: "", icon: Building, items: item.children!, description: undefined }]
                              ).map((group) => {
                                const GroupIcon = group.icon;
                                return (
                                  <div key={group.name || "default"}>
                                    {group.name && (
                                      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
                                        <GroupIcon className="w-3.5 h-3.5 text-primary-600" />
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{group.name}</p>
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      {group.items.map((child) => {
                                        const ChildIcon = child.icon;
                                        const childActive = hrefEsActivo(child.href);
                                        return (
                                          <Link
                                            key={child.name}
                                            href={child.href}
                                            className={cn(
                                              "flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-colors",
                                              childActive
                                                ? "bg-primary-50 text-primary-700"
                                                : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                                            )}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                          >
                                            <div className="flex items-center gap-3 min-w-0">
                                              <ChildIcon className={cn("w-5 h-5 flex-shrink-0", childActive ? "text-primary-600" : "text-slate-400")} />
                                              <span className="truncate">{child.name}</span>
                                            </div>
                                            {!childActive && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={item.href}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                            className={cn(
                              "flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold transition-colors",
                              isActive
                                ? "bg-primary-50 text-primary-700"
                                : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                            )}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              {Icon && <Icon className={cn("w-5 h-5", isActive ? "text-primary-600" : "text-slate-400")} />}
                              {item.name}
                            </div>
                            {!isActive && <ChevronRight className="w-4 h-4 text-slate-300" />}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                {currentUser && (
                  <div className="mt-auto pt-8">
                     <Button
                        variant="outline"
                        className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 h-12 font-semibold"
                        onClick={async () => {
                          setIsMobileMenuOpen(false);
                          await onLogout();
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
