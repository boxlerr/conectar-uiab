"use client";

import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { createClient } from "@/lib/supabase/cliente";
import { Card } from "@/components/ui/card";
import { ChipNorma } from "@/modulos/certificaciones/chip-norma";
import { SelectUIAB } from "@/components/ui/select-uiab";
import {
  NORMAS_POR_FAMILIA,
  NORMAS_FRECUENTES,
  CODIGO_OTRA,
  normaPorCodigo,
  etiquetaNorma,
  familiaNorma,
  estadoVigencia,
  type EstadoVigencia,
} from "@/modulos/certificaciones/normas";
import {
  listarCertificaciones,
  guardarCertificacion,
  eliminarCertificacion,
  type CertificacionFila,
  type CertificacionPayload,
} from "./acciones";
import {
  Award,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  FileText,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

const BUCKET_DOCS = "documentos-privados";
const MAX_MB = 10;

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition";
const labelCls = "block text-[13px] font-semibold text-slate-700 mb-1.5";

const ORGANISMOS = [
  "IRAM", "IRAM-INTI", "INTI", "TÜV Rheinland", "TÜV SÜD", "Bureau Veritas",
  "SGS", "DNV", "LRQA", "Intertek", "AENOR", "DQS", "ENARGAS", "ANMAT",
  "SENASA", "OPDS",
];

type FormState = {
  id: string | null;
  codigo_norma: string;
  nombre_libre: string;
  alcance: string;
  organismo_certificador: string;
  numero_certificado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
};

const FORM_VACIO: FormState = {
  id: null,
  codigo_norma: "",
  nombre_libre: "",
  alcance: "",
  organismo_certificador: "",
  numero_certificado: "",
  fecha_emision: "",
  fecha_vencimiento: "",
};

export default function MiPerfilCertificacionesPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certs, setCerts] = useState<CertificacionFila[]>([]);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const role = currentUser?.role === "company" ? "company" : "provider";
  const entityId = currentUser?.entityId ?? null;
  const carpeta = role === "company" ? "empresas" : "proveedores";

  useEffect(() => {
    if (authLoading) return;
    if (!entityId) {
      setFetching(false);
      return;
    }
    let vivo = true;
    (async () => {
      // try/finally: el spinner siempre se apaga aunque la query lance.
      try {
        const data = await listarCertificaciones(role, entityId);
        if (vivo) setCerts(data);
      } catch (err) {
        console.error("[perfil/certificaciones] listar falló:", err);
      } finally {
        if (vivo) setFetching(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [authLoading, entityId, role]);

  if (!currentUser) return null;

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // Sin empresa vinculada: mismo aviso que servicios/etiquetas.
  if (!entityId) {
    return (
      <div>
        <Encabezado />
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Completá tu perfil primero</p>
            <p className="text-sm text-amber-700 mt-1">
              Antes de cargar certificaciones guardá tus datos en{" "}
              <Link href="/perfil/datos" className="font-semibold underline">
                Datos y Contacto
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  const abrirFormNuevo = (codigo = "") => {
    setArchivo(null);
    setForm({ ...FORM_VACIO, codigo_norma: codigo });
  };

  const abrirFormEdicion = (c: CertificacionFila) => {
    setArchivo(null);
    setForm({
      id: c.id,
      codigo_norma: c.codigo_norma,
      nombre_libre: c.nombre_libre ?? "",
      alcance: c.alcance ?? "",
      organismo_certificador: c.organismo_certificador ?? "",
      numero_certificado: c.numero_certificado ?? "",
      fecha_emision: c.fecha_emision ?? "",
      fecha_vencimiento: c.fecha_vencimiento ?? "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cerrarForm = () => {
    setForm(null);
    setArchivo(null);
  };

  const onElegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error("Archivo demasiado pesado", { description: `El tamaño máximo es ${MAX_MB}MB.` });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setArchivo(f);
  };

  const guardar = async () => {
    if (!form) return;
    if (!form.codigo_norma) {
      toast.error("Elegí la norma o certificación.");
      return;
    }
    if (form.codigo_norma === CODIGO_OTRA && !form.nombre_libre.trim()) {
      toast.error("Escribí el nombre de la certificación.");
      return;
    }

    setSaving(true);
    try {
      let datosArchivo: Partial<CertificacionPayload> = {};

      if (archivo) {
        const safeName = archivo.name.replace(/[^\w.\-]+/g, "_");
        const ruta = `${carpeta}/${entityId}/certificaciones/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET_DOCS)
          .upload(ruta, archivo, { upsert: true, contentType: archivo.type });
        if (upErr) {
          toast.error("No pudimos subir el certificado", { description: upErr.message });
          setSaving(false);
          return;
        }
        datosArchivo = {
          bucket: BUCKET_DOCS,
          ruta_archivo: ruta,
          nombre_archivo: archivo.name,
          mime_type: archivo.type || null,
          tamano_bytes: archivo.size,
        };
      }

      const payload: CertificacionPayload = {
        codigo_norma: form.codigo_norma,
        nombre_libre: form.codigo_norma === CODIGO_OTRA ? form.nombre_libre.trim() : null,
        alcance: form.alcance.trim() || null,
        organismo_certificador: form.organismo_certificador.trim() || null,
        numero_certificado: form.numero_certificado.trim() || null,
        fecha_emision: form.fecha_emision || null,
        fecha_vencimiento: form.fecha_vencimiento || null,
        ...datosArchivo,
      };

      const res = await guardarCertificacion(role, entityId, payload, form.id);
      if ("error" in res) {
        toast.error(res.error);
        setSaving(false);
        return;
      }

      // Refrescar la lista desde el server (trae verificada, timestamps, etc.).
      const data = await listarCertificaciones(role, entityId);
      setCerts(data);
      toast.success(form.id ? "Certificación actualizada" : "Certificación agregada", {
        description: "Ya aparece en tu ficha y en el directorio.",
      });
      cerrarForm();
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (c: CertificacionFila) => {
    const etq = etiquetaNorma(c.codigo_norma, c.nombre_libre);
    if (!window.confirm(`¿Eliminar "${etq}"? Esta acción no se puede deshacer.`)) return;
    const res = await eliminarCertificacion(c.id);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setCerts((prev) => prev.filter((x) => x.id !== c.id));
    toast.success("Certificación eliminada");
  };

  const verArchivo = async (c: CertificacionFila) => {
    if (!c.bucket || !c.ruta_archivo) return;
    const { data, error } = await supabase.storage
      .from(c.bucket)
      .createSignedUrl(c.ruta_archivo, 3600);
    if (error || !data?.signedUrl) {
      toast.error("No pudimos abrir el certificado", { description: error?.message });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Encabezado />
        {certs.length > 0 && !form && (
          <button
            onClick={() => abrirFormNuevo()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-semibold shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        )}
      </div>

      {form && (
        <FormularioCertificacion
          form={form}
          setForm={setForm}
          archivo={archivo}
          onElegirArchivo={onElegirArchivo}
          quitarArchivo={() => {
            setArchivo(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          fileInputRef={fileInputRef}
          saving={saving}
          onGuardar={guardar}
          onCancelar={cerrarForm}
        />
      )}

      {certs.length === 0 && !form ? (
        <EmptyState onElegir={abrirFormNuevo} />
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <FilaCertificacion
              key={c.id}
              cert={c}
              onEditar={() => abrirFormEdicion(c)}
              onEliminar={() => eliminar(c)}
              onVerArchivo={() => verArchivo(c)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Encabezado() {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Award className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-slate-900">Certificaciones y normas</h1>
      </div>
      <p className="text-slate-500 text-sm mt-1 max-w-2xl">
        Cargá cada norma o habilitación por separado con su certificado. El sello aparece en tu
        ficha y como iconito en el directorio; el archivo del certificado queda privado.
      </p>
    </div>
  );
}

function EmptyState({ onElegir }: { onElegir: (codigo?: string) => void }) {
  return (
    <Card className="border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4 border border-primary-100">
        <Award className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Todavía no cargaste ninguna certificación</h2>
      <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
        Si tu empresa tiene ISO, BPM o una habilitación al día, cargala. El sello aparece en tu ficha
        y en las tarjetas del directorio, y hacés match cuando alguien busca proveedores con esa norma.
      </p>

      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3">
        Las más comunes — tocá para empezar
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
        {NORMAS_FRECUENTES.map((codigo) => {
          const n = normaPorCodigo(codigo);
          if (!n) return null;
          return (
            <button
              key={codigo}
              onClick={() => onElegir(codigo)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50/50 transition shadow-sm"
              title={n.nombre}
            >
              <Plus className="w-3.5 h-3.5 text-slate-400" />
              {n.etiqueta}
            </button>
          );
        })}
        <button
          onClick={() => onElegir()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:border-slate-400 transition shadow-sm"
        >
          Otra…
        </button>
      </div>
    </Card>
  );
}

function FormularioCertificacion({
  form,
  setForm,
  archivo,
  onElegirArchivo,
  quitarArchivo,
  fileInputRef,
  saving,
  onGuardar,
  onCancelar,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  archivo: File | null;
  onElegirArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  quitarArchivo: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  saving: boolean;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  const set = (patch: Partial<FormState>) => setForm({ ...form, ...patch });
  const esOtra = form.codigo_norma === CODIGO_OTRA;
  const etiquetaPreview = form.codigo_norma
    ? etiquetaNorma(form.codigo_norma, form.nombre_libre)
    : "Tu norma";
  const familiaPreview = form.codigo_norma ? familiaNorma(form.codigo_norma) : "otras";

  return (
    <Card className="p-6 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-slate-900">
          {form.id ? "Editar certificación" : "Nueva certificación"}
        </h2>
        <button onClick={onCancelar} className="text-slate-400 hover:text-slate-600 transition" aria-label="Cerrar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <div className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="cert-norma">
              Norma o certificación <span className="text-rose-500">*</span>
            </label>
            <SelectUIAB
              id="cert-norma"
              ariaLabel="Norma"
              placeholder="Elegí una norma…"
              value={form.codigo_norma}
              onValueChange={(v) => set({ codigo_norma: v })}
              className={inputCls}
              options={[
                ...NORMAS_POR_FAMILIA.map((g) => ({
                  label: g.etiqueta,
                  options: g.normas.map((n) => ({ value: n.codigo, label: `${n.etiqueta} — ${n.nombre}` })),
                })),
                { label: "Otra", options: [{ value: CODIGO_OTRA, label: "Otra certificación…" }] },
              ]}
            />
          </div>

          {esOtra && (
            <div>
              <label className={labelCls} htmlFor="cert-libre">
                Nombre de la certificación <span className="text-rose-500">*</span>
              </label>
              <input
                id="cert-libre"
                value={form.nombre_libre}
                onChange={(e) => set({ nombre_libre: e.target.value })}
                className={inputCls}
                placeholder="Ej.: Certificación orgánica, Sello verde…"
              />
            </div>
          )}

          <div>
            <label className={labelCls} htmlFor="cert-alcance">
              Alcance <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="cert-alcance"
              value={form.alcance}
              onChange={(e) => set({ alcance: e.target.value })}
              className={`${inputCls} min-h-[72px] resize-y`}
              placeholder="Ej.: Diseño, fabricación y comercialización de piezas mecanizadas en la planta de Burzaco."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="cert-org">
                Organismo certificador <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="cert-org"
                list="organismos-cert"
                value={form.organismo_certificador}
                onChange={(e) => set({ organismo_certificador: e.target.value })}
                className={inputCls}
                placeholder="Ej.: IRAM, TÜV Rheinland…"
              />
              <datalist id="organismos-cert">
                {ORGANISMOS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls} htmlFor="cert-num">
                N° de certificado <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="cert-num"
                value={form.numero_certificado}
                onChange={(e) => set({ numero_certificado: e.target.value })}
                className={inputCls}
                placeholder="Ej.: AR-12345"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="cert-emision">
                Fecha de emisión <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="cert-emision"
                type="date"
                value={form.fecha_emision}
                onChange={(e) => set({ fecha_emision: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="cert-venc">
                Fecha de vencimiento <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="cert-venc"
                type="date"
                value={form.fecha_vencimiento}
                onChange={(e) => set({ fecha_vencimiento: e.target.value })}
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-1">Dejalo vacío si no vence.</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Certificado (PDF o imagen) <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            {archivo ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                <span className="text-sm text-slate-700 truncate flex-1">{archivo.name}</span>
                <button onClick={quitarArchivo} className="text-slate-400 hover:text-rose-500 transition" aria-label="Quitar archivo">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 justify-center border border-dashed border-slate-300 rounded-lg px-3 py-3 text-sm font-medium text-slate-500 hover:border-primary-400 hover:text-primary-600 transition"
              >
                <UploadCloud className="w-4 h-4" />
                Subir certificado (máx. {MAX_MB}MB)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={onElegirArchivo}
              className="hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Sólo lo ve la UIAB para verificar tu carga. No se publica.
            </p>
          </div>
        </div>

        {/* Preview del chip */}
        <div className="lg:w-52 shrink-0">
          <div className="lg:sticky lg:top-20 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Así se ve en el directorio
            </p>
            <div className="flex justify-center">
              <ChipNorma etiqueta={etiquetaPreview} familia={familiaPreview} size="md" />
            </div>
            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Aparece en tu ficha y en las tarjetas del directorio apenas la guardás.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
        <button
          onClick={onCancelar}
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onGuardar}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-semibold disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Agregar certificación"}
        </button>
      </div>
    </Card>
  );
}

const VIGENCIA_BADGE: Record<EstadoVigencia, { texto: (f: string) => string; cls: string } | null> = {
  sin_vencimiento: null,
  vigente: { texto: (f) => `Vigente hasta ${f}`, cls: "bg-slate-100 text-slate-500" },
  // "Vence pronto" se sacó a propósito: la vigencia es responsabilidad de cada socia, no la vigilamos.
  por_vencer: null,
  vencida: { texto: (f) => `Vencida · ${f}`, cls: "bg-rose-50 text-rose-700" },
};

function formatearFecha(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}

function FilaCertificacion({
  cert,
  onEditar,
  onEliminar,
  onVerArchivo,
}: {
  cert: CertificacionFila;
  onEditar: () => void;
  onEliminar: () => void;
  onVerArchivo: () => void;
}) {
  const n = normaPorCodigo(cert.codigo_norma);
  const etiqueta = etiquetaNorma(cert.codigo_norma, cert.nombre_libre);
  const familia = familiaNorma(cert.codigo_norma);
  const estado = estadoVigencia(cert.fecha_vencimiento);
  const badge = cert.fecha_vencimiento ? VIGENCIA_BADGE[estado] : null;

  return (
    <Card className="p-5 border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ChipNorma etiqueta={etiqueta} familia={familia} size="md" />
            {badge && (
              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded ${badge.cls}`}>
                {badge.texto(formatearFecha(cert.fecha_vencimiento!))}
              </span>
            )}
          </div>

          {n && n.codigo !== CODIGO_OTRA && (
            <p className="text-sm font-semibold text-slate-800 mt-2">{n.nombre}</p>
          )}
          {cert.alcance && <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{cert.alcance}</p>}
          {(cert.organismo_certificador || cert.numero_certificado) && (
            <p className="text-[12px] text-slate-400 mt-1.5">
              {cert.organismo_certificador && <>Certificada por {cert.organismo_certificador}</>}
              {cert.organismo_certificador && cert.numero_certificado && " · "}
              {cert.numero_certificado && <>Cert. N° {cert.numero_certificado}</>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {cert.bucket && cert.ruta_archivo && (
            <button
              onClick={onVerArchivo}
              className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
              title="Ver certificado"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEditar}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onEliminar}
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
