"use client";

import Link from "next/link";
import { Building, Wrench, Mail, Info, ChevronRight, Github, Twitter, Linkedin, Instagram } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand & Description */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <span className="text-white font-bold text-2xl">UIAB</span>
              </div>
              <span className="font-bold text-2xl text-white tracking-tight">
                Conectar<span className="text-primary-500">UIAB</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              La red industrial de confianza para la Unión Industrial de Almirante Brown. 
              Conectamos empresas y proveedores para fortalecer nuestra industria local.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary-600 hover:text-white transition-all duration-300">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  Inicio
                </Link>
              </li>
              <li>
                <a href="https://www.uiab.org" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  Nosotros (UIAB)
                </a>
              </li>
              <li>
                <Link href="/empresas" className="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  Directorio de Empresas
                </Link>
              </li>
              <li>
                <Link href="/proveedores" className="text-sm text-slate-400 hover:text-primary-400 transition-colors flex items-center gap-2 group">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  Directorio de Proveedores
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center text-primary-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Email</p>
                  <a href="mailto:info@uiab.org" className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    info@uiab.org
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center text-primary-400">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Sede</p>
                  <p className="text-sm text-slate-400">
                    Parque Industrial Alte. Brown
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter / Call to Action */}
          <div>
            <h3 className="text-white font-semibold mb-6">Únete a la Red</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Sé parte del directorio industrial más grande de la región y conecta con nuevos clientes.
            </p>
            <Link 
              href="/contacto" 
              className="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors border border-primary-500 shadow-lg shadow-primary-600/20"
            >
              Contactar para unirse
            </Link>
          </div>

        </div>
      </div>

      {/* Copyright & Developer Tag */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {currentYear} Unión Industrial de Almirante Brown. Todos los derechos reservados.
            </p>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
              <span>Desarrollado por</span>
              <a 
                href="https://vaxler.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1.5"
              >
                vaxler
                <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
