"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Check, X, Star, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { aprobarResena, rechazarResena } from "@/modulos/admin/acciones";

type Resena = {
  id: string;
  calificacion: number;
  comentario: string | null;
  estado: string;
  motivo_moderacion: string | null;
  creada_en: string;
  empresa_resenada?: { razon_social: string } | null;
  proveedor_resenado?: { nombre: string; apellido: string | null } | null;
  empresa_autora?: { razon_social: string } | null;
  proveedor_autor?: { nombre: string } | null;
};

type Filtro = "all" | "pendiente_revision" | "aprobada" | "rechazada";

const BADGE: Record<string, { label: string; className: string }> = {
  aprobada:            { label: "Aprobada", className: "bg-emerald-100 text-emerald-700" },
  pendiente_revision:  { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  rechazada:           { label: "Rechazada", className: "bg-rose-100 text-rose-700" },
  oculta:              { label: "Oculta", className: "bg-slate-100 text-slate-500" },
};

function Estrellas({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= n ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
      ))}
    </div>
  );
}

export function PanelResenas({ resenas }: { resenas: Resena[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("pendiente_revision");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionada, setSeleccionada] = useState<Resena | null>(null);
  const [modalRechazo, setModalRechazo] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const nombreDestinatario = (r: Resena) =>
    r.empresa_resenada?.razon_social ??
    [r.proveedor_resenado?.nombre, r.proveedor_resenado?.apellido].filter(Boolean).join(" ") ??
    "–";

  const nombreAutor = (r: Resena) =>
    r.empresa_autora?.razon_social ?? r.proveedor_autor?.nombre ?? "–";

  const filtradas = resenas.filter((r) => {
    const matchFiltro = filtro === "all" || r.estado === filtro;
    const matchBusqueda = !busqueda ||
      nombreDestinatario(r).toLowerCase().includes(busqueda.toLowerCase()) ||
      nombreAutor(r).toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.comentario ?? "").toLowerCase().includes(busqueda.toLowerCase());
    return matchFiltro && matchBusqueda;
  });

  const counts = {
    all: resenas.length,
    pendiente_revision: resenas.filter((r) => r.estado === "pendiente_revision").length,
    aprobada: resenas.filter((r) => r.estado === "aprobada").length,
    rechazada: resenas.filter((r) => r.estado === "rechazada").length,
  };

  function refresh() { startTransition(() => router.refresh()); }

  async function handleAprobar(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    await aprobarResena(id);
    refresh();
  }

  async function handleRechazar() {
    if (!modalRechazo || !motivo.trim()) return;
    await rechazarResena(modalRechazo, motivo);
    setModalRechazo(null);
    setMotivo("");
    refresh();
  }

  const TABS: { key: Filtro; label: string }[] = [
    { key: "pendiente_revision", label: `Pendientes (${counts.pendiente_revision})` },
    { key: "aprobada", label: `Aprobadas (${counts.aprobada})` },
    { key: "rechazada", label: `Rechazadas (${counts.rechazada})` },
    { key: "all", label: `Todas (${counts.all})` },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-amber-500" />
          Moderación de Reseñas
        </h1>
        <p className="text-slate-500 mt-1">Revisá y moderá las reseñas antes de publicarlas.</p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm border-slate-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa, particular o contenido..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setFiltro(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                filtro === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay reseñas con este filtro.</p>
          </div>
        ) : filtradas.map((resena) => {
          const badge = BADGE[resena.estado] ?? { label: resena.estado, className: "bg-slate-100 text-slate-600" };
          return (
            <Card key={resena.id}
              className="p-5 shadow-sm border-slate-100 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
              onClick={() => setSeleccionada(resena)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Estrellas n={resena.calificacion} />
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 mb-2">
                    {resena.comentario ?? <span className="italic text-slate-400">Sin comentario.</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{nombreAutor(resena)}</span>
                    {" → "}
                    <span className="font-medium text-slate-600">{nombreDestinatario(resena)}</span>
                    {" · "}
                    {new Date(resena.creada_en).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {resena.estado === "pendiente_revision" && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-8 p-0"
                      onClick={(e) => handleAprobar(resena.id, e)} disabled={isPending}>
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  {(resena.estado === "pendiente_revision" || resena.estado === "aprobada") && (
                    <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); setModalRechazo(resena.id); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Slide-over detalle */}
      {seleccionada && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" onClick={() => setSeleccionada(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl overflow-y-auto border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">Detalle de Reseña</h2>
                  <Estrellas n={seleccionada.calificacion} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSeleccionada(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Participantes</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2"><span className="text-slate-400 w-20">Autor</span><span className="font-medium">{nombreAutor(seleccionada)}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-20">Destinatario</span><span className="font-medium">{nombreDestinatario(seleccionada)}</span></div>
                  <div className="flex gap-2"><span className="text-slate-400 w-20">Fecha</span><span className="font-medium">{new Date(seleccionada.creada_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
                </div>
              </section>
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Comentario</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">
                  {seleccionada.comentario ?? <span className="italic text-slate-400">Sin comentario escrito.</span>}
                </p>
              </section>
              {seleccionada.motivo_moderacion && (
                <section>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Motivo de moderación</p>
                  <p className="text-sm text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-100">{seleccionada.motivo_moderacion}</p>
                </section>
              )}
            </div>
            {(seleccionada.estado === "pendiente_revision" || seleccionada.estado === "aprobada") && (
              <div className="sticky bottom-0 bg-white/95 border-t border-slate-100 p-5 flex gap-3">
                {seleccionada.estado === "pendiente_revision" && (
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}
                    onClick={() => handleAprobar(seleccionada.id)}>
                    <Check className="w-4 h-4 mr-2" /> Publicar reseña
                  </Button>
                )}
                <Button variant="outline" className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 bg-white" disabled={isPending}
                  onClick={() => setModalRechazo(seleccionada.id)}>
                  <X className="w-4 h-4 mr-2" /> Rechazar
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Rechazo */}
      {modalRechazo && (
        <>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={() => setModalRechazo(null)} />
          <div className="fixed z-50 inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Rechazar reseña</h3>
              <p className="text-sm text-slate-500 mb-4">Ingresá el motivo de moderación. No será visible para el autor.</p>
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Contiene lenguaje inapropiado o información falsa."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setModalRechazo(null); setMotivo(""); }}>Cancelar</Button>
                <Button className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={!motivo.trim() || isPending}
                  onClick={handleRechazar}>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
