"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, Search, FileText, ShieldCheck, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChipNorma } from "@/modulos/certificaciones/chip-norma";
import { etiquetaNorma, familiaNorma, estadoVigencia } from "@/modulos/certificaciones/normas";
import { verificarCertificacion } from "@/modulos/admin/acciones";
import { toast } from "sonner";

export interface CertificacionAdmin {
  id: string;
  codigo_norma: string;
  nombre_libre: string | null;
  alcance: string | null;
  organismo_certificador: string | null;
  numero_certificado: string | null;
  fecha_vencimiento: string | null;
  verificada: boolean;
  creado_en: string;
  entidad: string;
  archivoUrl: string | null;
}

type Filtro = "sin_verificar" | "verificadas" | "all";

export function PanelCertificaciones({ certificaciones }: { certificaciones: CertificacionAdmin[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("sin_verificar");
  const [busqueda, setBusqueda] = useState("");

  const counts = {
    sin_verificar: certificaciones.filter((c) => !c.verificada).length,
    verificadas: certificaciones.filter((c) => c.verificada).length,
    all: certificaciones.length,
  };

  const filtradas = certificaciones.filter((c) => {
    const matchFiltro =
      filtro === "all" ||
      (filtro === "sin_verificar" && !c.verificada) ||
      (filtro === "verificadas" && c.verificada);
    const term = busqueda.trim().toLowerCase();
    const etq = etiquetaNorma(c.codigo_norma, c.nombre_libre).toLowerCase();
    const matchBusqueda =
      term === "" || c.entidad.toLowerCase().includes(term) || etq.includes(term);
    return matchFiltro && matchBusqueda;
  });

  const toggle = (c: CertificacionAdmin) => {
    startTransition(async () => {
      const res = await verificarCertificacion(c.id, !c.verificada);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(c.verificada ? "Verificación quitada" : "Certificación verificada");
      router.refresh();
    });
  };

  const TABS: { key: Filtro; label: string }[] = [
    { key: "sin_verificar", label: `Sin verificar (${counts.sin_verificar})` },
    { key: "verificadas", label: `Verificadas (${counts.verificadas})` },
    { key: "all", label: `Todas (${counts.all})` },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificaciones</h1>
          <p className="text-sm text-slate-500">
            Revisá el certificado adjunto y verificá cada norma. El sello verificado aparece en la
            ficha pública y en el directorio.
          </p>
        </div>
      </div>

      <Card className="p-4 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setFiltro(t.key)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition ${
                  filtro === t.key
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por empresa o norma…"
              className="pl-9 pr-3 py-2 w-full sm:w-64 rounded-lg border border-slate-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {filtradas.length === 0 ? (
        <Card className="p-10 text-center border-slate-200">
          <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay certificaciones que coincidan.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((c) => {
            const etiqueta = etiquetaNorma(c.codigo_norma, c.nombre_libre);
            const familia = familiaNorma(c.codigo_norma);
            const estado = estadoVigencia(c.fecha_vencimiento);
            return (
              <Card key={c.id} className="p-5 border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{c.entidad}</span>
                      <ChipNorma etiqueta={etiqueta} familia={familia} verificada={c.verificada} size="md" />
                      {c.fecha_vencimiento && estado === "vencida" && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          Vencida
                        </span>
                      )}
                    </div>
                    {c.alcance && <p className="text-[13px] text-slate-500 mt-1.5 line-clamp-2">{c.alcance}</p>}
                    <p className="text-[12px] text-slate-400 mt-1">
                      {c.organismo_certificador && <>Certificada por {c.organismo_certificador}</>}
                      {c.organismo_certificador && c.numero_certificado && " · "}
                      {c.numero_certificado && <>Cert. N° {c.numero_certificado}</>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {c.archivoUrl ? (
                      <a
                        href={c.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                      >
                        <FileText className="w-4 h-4" />
                        Ver certificado
                      </a>
                    ) : (
                      <span className="text-[12px] text-slate-400 px-2">Sin archivo</span>
                    )}
                    <button
                      onClick={() => toggle(c)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition disabled:opacity-50 ${
                        c.verificada
                          ? "text-slate-600 border border-slate-200 hover:bg-slate-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {c.verificada ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          Quitar verificación
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verificar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Verificar significa que la UIAB cotejó el certificado adjunto contra la norma declarada.
        La UIAB no emite ni audita certificaciones.
      </p>
    </div>
  );
}
