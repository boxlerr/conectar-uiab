"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, ChevronRight, ExternalLink } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const quickLinks = [
  { label: "Inicio", href: "/" },
  { label: "Empresas", href: "/empresas" },
  { label: "Proveedores", href: "/proveedores" },
  { label: "Oportunidades", href: "/oportunidades" },
  { label: "Contacto", href: "/contacto" },
];

const legalLinks = [
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Términos y Condiciones", href: "/terminos" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0a0f1a] text-slate-300 overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-primary-600/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-blue-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* ─── Main Content ─── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand Column */}
          <div className="md:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center">
                <Image
                  src="/logo-prueba.png"
                  alt="UIAB Logo"
                  width={44}
                  height={44}
                  className="object-contain filter brightness-0 invert opacity-90"
                />
              </div>
              <div>
                <span className="font-bold text-xl text-white tracking-tight">
                  UIAB<span className="text-primary-400">Conecta</span>
                </span>
                <p className="text-[11px] text-slate-500 tracking-[0.08em] uppercase leading-none mt-0.5">
                  Red Industrial de Confianza
                </p>
              </div>
            </div>

            <p className="text-[13px] text-slate-500 leading-relaxed max-w-xs">
              La plataforma que conecta empresas radicadas y proveedores verificados del Parque Industrial de Almirante Brown. Fortaleciendo la industria local, juntos.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/uiabarg/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-slate-500 hover:bg-primary-500/20 hover:text-primary-400 transition-all duration-300"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/uiab-org/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-slate-500 hover:bg-primary-500/20 hover:text-primary-400 transition-all duration-300"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-5">
              Navegación
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-primary-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-5">
              Contacto
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 w-7 h-7 rounded-md bg-white/[0.04] flex flex-shrink-0 items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[13px] text-slate-400 leading-snug">
                    Luis María Drago 1951
                  </p>
                  <p className="text-[13px] text-slate-500 leading-snug">
                    Piso 2, Of. 14 y 15
                  </p>
                  <p className="text-[12px] text-slate-600 leading-snug mt-0.5">
                    Burzaco, Almirante Brown
                  </p>
                  <p className="text-[12px] text-slate-600 leading-snug">
                    B1852LHA Buenos Aires, Argentina
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-white/[0.04] flex flex-shrink-0 items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <a
                  href="tel:+5491130622001"
                  className="text-[13px] text-slate-400 hover:text-white transition-colors"
                >
                  +54 9 11 3062 2001
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-white/[0.04] flex flex-shrink-0 items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <a
                  href="mailto:gerencia.ejecutiva@uiab.org"
                  className="text-[13px] text-slate-400 hover:text-white transition-colors"
                >
                  gerencia.ejecutiva@uiab.org
                </a>
              </li>
            </ul>
          </div>

          {/* Institutional Column */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.12em] mb-5">
              Institucional
            </h4>
            <ul className="space-y-2.5 mb-6">
              <li>
                <a
                  href="https://www.uiab.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                >
                  <ExternalLink className="w-3 h-3 text-slate-700 group-hover:text-primary-400 transition-colors" />
                  Unión Industrial (UIAB)
                </a>
              </li>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-slate-500 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-primary-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-primary-400 hover:text-primary-300 transition-colors group"
            >
              Solicitar ingreso a la red
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom Bar ─── */}
      <div className="relative z-10 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-slate-600">
              &copy; {currentYear} Unión Industrial de Almirante Brown. Todos los derechos reservados.
            </p>

            <a
              href="https://vaxler.com.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-40 hover:opacity-100 transition-opacity duration-300"
            >
              <Image
                src="/logo-vaxler.png"
                alt="Vaxler Logo"
                width={70}
                height={20}
                className="h-4 w-auto brightness-0 invert"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
