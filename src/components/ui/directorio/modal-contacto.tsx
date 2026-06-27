"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mail, Phone, Globe, MapPin, Copy, Check, X, Lock } from "lucide-react";

type ColorScheme = "blue" | "amber";

interface DatoContacto {
  tipo: "email" | "telefono" | "sitioWeb" | "ubicacion";
  label: string;
  valor: string;
  copiable: boolean;
}

interface ModalContactoProps {
  nombre: string;
  email?: string;
  telefono?: string;
  sitioWeb?: string;
  ubicacion?: string;
  colorScheme?: ColorScheme;
  className?: string;
  children?: React.ReactNode;
}

const COLORES = {
  blue: {
    boton: "bg-[#00213f] hover:bg-[#10375c]",
    icono: "text-blue-600",
    acento: "text-blue-700",
    anillo: "focus:ring-blue-200",
  },
  amber: {
    boton: "bg-[#bf7035] hover:bg-[#a0622c]",
    icono: "text-[#bf7035]",
    acento: "text-[#bf7035]",
    anillo: "focus:ring-[#bf7035]/30",
  },
} as const;

const ICONOS = {
  email: Mail,
  telefono: Phone,
  sitioWeb: Globe,
  ubicacion: MapPin,
} as const;

function esValorReal(valor?: string) {
  if (!valor) return false;
  const v = valor.trim().toLowerCase();
  return v !== "" && v !== "protegido" && v !== "no disponible";
}

function FilaDato({ dato, scheme }: { dato: DatoContacto; scheme: ColorScheme }) {
  const [copiado, setCopiado] = useState(false);
  const Icono = ICONOS[dato.tipo];
  const colores = COLORES[scheme];

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(dato.valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // navegadores sin permiso de portapapeles: selección manual
    }
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded-md border border-slate-200 bg-white">
      <Icono className={`w-4 h-4 shrink-0 ${colores.icono}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-0.5">
          {dato.label}
        </p>
        <p className="text-slate-700 font-semibold text-[14px] leading-snug break-all">
          {dato.valor}
        </p>
      </div>
      {dato.copiable && (
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar ${dato.label.toLowerCase()}`}
          className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 ${colores.anillo}`}
        >
          {copiado ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </li>
  );
}

export function ModalContacto({
  nombre,
  email,
  telefono,
  sitioWeb,
  ubicacion,
  colorScheme = "blue",
  className = "",
  children,
}: ModalContactoProps) {
  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const colores = COLORES[colorScheme];

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [abierto]);

  const datos: DatoContacto[] = [];
  if (esValorReal(email)) {
    datos.push({ tipo: "email", label: "Correo", valor: email!.trim(), copiable: true });
  }
  if (esValorReal(telefono)) {
    datos.push({ tipo: "telefono", label: "Teléfono", valor: telefono!.trim(), copiable: true });
  }
  if (esValorReal(sitioWeb)) {
    const web = sitioWeb!.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    datos.push({ tipo: "sitioWeb", label: "Sitio web", valor: web, copiable: true });
  }
  if (esValorReal(ubicacion)) {
    datos.push({ tipo: "ubicacion", label: "Ubicación", valor: ubicacion!.trim(), copiable: true });
  }

  const modal = abierto && montado
    ? createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Datos de contacto de ${nombre}`}
        >
          <div
            className="absolute inset-0 bg-[#00182e]/60 backdrop-blur-sm"
            onClick={() => setAbierto(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200 bg-slate-50/60">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Datos de contacto
                </p>
                <h3 className="font-manrope text-lg font-bold text-[#00213f] leading-tight truncate">
                  {nombre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {datos.length > 0 ? (
                <ul className="space-y-3">
                  {datos.map((dato) => (
                    <FilaDato key={dato.tipo} dato={dato} scheme={colorScheme} />
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm text-center py-6">
                  No hay datos de contacto disponibles.
                </p>
              )}

              {esValorReal(email) && (
                <a
                  href={`mailto:${email!.trim()}`}
                  className={`mt-5 flex items-center justify-center gap-2 w-full ${colores.boton} px-5 py-3 text-xs font-bold text-white rounded-md transition-colors tracking-[0.15em] uppercase`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Enviar correo
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={className}>
        {children ?? (
          <>
            <Mail className="w-3.5 h-3.5" />
            Contactar
          </>
        )}
      </button>
      {modal}
    </>
  );
}
