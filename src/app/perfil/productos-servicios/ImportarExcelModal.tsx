"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { createItemsBulk, type ItemPayload } from "./acciones";

type Columna = {
  key: keyof ItemPayload | "palabras_clave_texto";
  header: string;
  descripcion: string;
  requerido?: boolean;
  ejemplo: string;
};

const COLUMNAS: Columna[] = [
  { key: "nombre", header: "nombre", descripcion: "Nombre del ítem", requerido: true, ejemplo: "Desarrollo Web" },
  { key: "tipo_item", header: "tipo_item", descripcion: "producto o servicio", requerido: true, ejemplo: "servicio" },
  { key: "descripcion_corta", header: "descripcion_corta", descripcion: "Resumen breve (máx 200 car.)", ejemplo: "Sitio web a medida" },
  { key: "descripcion_larga", header: "descripcion_larga", descripcion: "Detalle extendido", ejemplo: "Diseño, desarrollo y despliegue..." },
  { key: "sku", header: "sku", descripcion: "Código interno (opcional)", ejemplo: "WEB-001" },
  { key: "unidad", header: "unidad", descripcion: "Unidad de medida", ejemplo: "proyecto" },
  { key: "precio", header: "precio", descripcion: "Número, sin símbolos. Vacío si no aplica", ejemplo: "150000" },
  { key: "moneda", header: "moneda", descripcion: "ARS o USD", ejemplo: "ARS" },
  { key: "precio_a_consultar", header: "precio_a_consultar", descripcion: "sí / no", ejemplo: "no" },
  { key: "destacado", header: "destacado", descripcion: "sí / no", ejemplo: "no" },
  { key: "estado", header: "estado", descripcion: "publicado o borrador", ejemplo: "publicado" },
  { key: "palabras_clave_texto", header: "palabras_clave", descripcion: "Separadas por coma", ejemplo: "web, desarrollo, nextjs" },
];

function parseBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return ["si", "sí", "yes", "y", "true", "1", "x"].includes(s);
}

function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.,-]/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

function normalizarTipo(v: any): "producto" | "servicio" | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.startsWith("prod")) return "producto";
  if (s.startsWith("serv")) return "servicio";
  return null;
}

function normalizarEstado(v: any): "borrador" | "publicado" {
  const s = String(v ?? "").trim().toLowerCase();
  return s.startsWith("borr") ? "borrador" : "publicado";
}

function normalizarMoneda(v: any): string {
  const s = String(v ?? "").trim().toUpperCase();
  return s === "USD" ? "USD" : "ARS";
}

type FilaParseada = {
  fila: number;
  payload?: ItemPayload;
  errores: string[];
};

interface Props {
  role: "company" | "provider";
  entityId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportarExcelModal({ role, entityId, onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filas, setFilas] = useState<FilaParseada[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string>("");
  const [importando, setImportando] = useState(false);

  const descargarPlantilla = () => {
    const headers = COLUMNAS.map((c) => c.header);
    const ejemploProducto: Record<string, any> = {
      nombre: "Auriculares Pro X",
      tipo_item: "producto",
      descripcion_corta: "Auriculares inalámbricos con cancelación de ruido",
      descripcion_larga: "Batería 30h, Bluetooth 5.3, estuche de carga incluido.",
      sku: "AUR-PRO-X",
      unidad: "unidad",
      precio: 89999,
      moneda: "ARS",
      precio_a_consultar: "no",
      destacado: "sí",
      estado: "publicado",
      palabras_clave: "auriculares, audio, bluetooth",
    };
    const ejemploServicio: Record<string, any> = {
      nombre: "Desarrollo Web a medida",
      tipo_item: "servicio",
      descripcion_corta: "Diseño y desarrollo de sitios web.",
      descripcion_larga: "Incluye diseño, programación, SEO básico y despliegue.",
      sku: "",
      unidad: "proyecto",
      precio: "",
      moneda: "ARS",
      precio_a_consultar: "sí",
      destacado: "no",
      estado: "publicado",
      palabras_clave: "web, desarrollo, nextjs",
    };

    const ws = XLSX.utils.json_to_sheet([ejemploProducto, ejemploServicio], { header: headers });
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos y Servicios");
    XLSX.writeFile(wb, "plantilla-productos-servicios.xlsx");
  };

  const procesarArchivo = async (file: File) => {
    setNombreArchivo(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      const resultado: FilaParseada[] = rows.map((row, idx) => {
        const errores: string[] = [];
        const nombre = String(row["nombre"] ?? "").trim();
        const tipo = normalizarTipo(row["tipo_item"]);

        if (!nombre) errores.push("Falta 'nombre'");
        if (!tipo) errores.push("'tipo_item' debe ser 'producto' o 'servicio'");

        const precio = parseNumber(row["precio"]);
        const precioAConsultar = parseBool(row["precio_a_consultar"]);
        const palabrasRaw = String(row["palabras_clave"] ?? "").trim();
        const palabras_clave = palabrasRaw
          ? palabrasRaw.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

        const payload: ItemPayload | undefined =
          nombre && tipo
            ? {
                nombre,
                tipo_item: tipo,
                descripcion_corta: String(row["descripcion_corta"] ?? "").trim() || undefined,
                descripcion_larga: String(row["descripcion_larga"] ?? "").trim() || undefined,
                sku: String(row["sku"] ?? "").trim() || undefined,
                unidad: String(row["unidad"] ?? "").trim() || undefined,
                precio: precio,
                moneda: normalizarMoneda(row["moneda"]),
                precio_a_consultar: precioAConsultar,
                destacado: parseBool(row["destacado"]),
                estado: normalizarEstado(row["estado"]),
                palabras_clave,
                enlaces: [],
              }
            : undefined;

        return { fila: idx + 2, payload, errores };
      });

      if (resultado.length === 0) {
        toast.error("El archivo no contiene filas de datos.");
        return;
      }
      setFilas(resultado);
    } catch (err: any) {
      console.error(err);
      toast.error("No se pudo leer el archivo", { description: err?.message });
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) procesarArchivo(file);
  };

  const validas = filas.filter((f) => f.payload && f.errores.length === 0);
  const invalidas = filas.filter((f) => f.errores.length > 0);

  const confirmarImportacion = async () => {
    if (!validas.length) {
      toast.error("No hay filas válidas para importar.");
      return;
    }
    setImportando(true);
    const res = await createItemsBulk(role, entityId, validas.map((f) => f.payload!));
    setImportando(false);
    if (res?.error) {
      toast.error("Error al importar", { description: res.error });
      return;
    }
    toast.success(`${res.count} ítem(s) importado(s) correctamente.`);
    onSuccess();
  };

  const reset = () => {
    setFilas([]);
    setNombreArchivo("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Importar desde Excel</h2>
              <p className="text-xs text-slate-500">
                Cargá productos y servicios de forma masiva.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {filas.length === 0 ? (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 space-y-2">
                  <p className="font-semibold">Cómo funciona</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Descargá la plantilla Excel con el orden y nombre exacto de columnas.</li>
                    <li>Completá una fila por cada producto o servicio.</li>
                    <li>Subí el archivo para previsualizar y confirmar la importación.</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-3">
                  Columnas de la plantilla (respetar nombre y orden)
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left w-10">#</th>
                        <th className="px-3 py-2 text-left">Columna</th>
                        <th className="px-3 py-2 text-left">Descripción</th>
                        <th className="px-3 py-2 text-left">Ejemplo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {COLUMNAS.map((c, i) => (
                        <tr key={c.header}>
                          <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2">
                            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                              {c.header}
                            </code>
                            {c.requerido && (
                              <span className="ml-2 text-[10px] font-bold text-rose-600 uppercase">
                                requerido
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{c.descripcion}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs">{c.ejemplo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Para sí/no podés usar: <code>sí</code>, <code>no</code>, <code>true</code>, <code>false</code>, <code>1</code>, <code>0</code>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={descargarPlantilla}
                  className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar plantilla Excel
                </Button>
                <Button
                  onClick={() => inputRef.current?.click()}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir archivo .xlsx
                </Button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={onFileChange}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{nombreArchivo}</p>
                    <p className="text-xs text-slate-500">
                      {filas.length} fila(s) leída(s) · {validas.length} válida(s) · {invalidas.length} con error
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500">
                  Cambiar archivo
                </Button>
              </div>

              {invalidas.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2 text-rose-800 font-semibold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Filas con errores ({invalidas.length}) — se ignorarán
                  </div>
                  <ul className="text-xs text-rose-700 space-y-1 max-h-40 overflow-y-auto">
                    {invalidas.map((f) => (
                      <li key={f.fila}>
                        <strong>Fila {f.fila}:</strong> {f.errores.join("; ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Fila</th>
                        <th className="px-3 py-2 text-left">Nombre</th>
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Precio</th>
                        <th className="px-3 py-2 text-left">Estado</th>
                        <th className="px-3 py-2 text-left">OK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filas.map((f) => (
                        <tr key={f.fila} className={f.errores.length ? "bg-rose-50/40" : ""}>
                          <td className="px-3 py-1.5 text-slate-400">{f.fila}</td>
                          <td className="px-3 py-1.5 text-slate-800">
                            {f.payload?.nombre || <em className="text-slate-400">—</em>}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{f.payload?.tipo_item || "—"}</td>
                          <td className="px-3 py-1.5 text-slate-600">
                            {f.payload?.precio_a_consultar
                              ? "A consultar"
                              : f.payload?.precio != null
                              ? `${f.payload.moneda} ${f.payload.precio}`
                              : "—"}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{f.payload?.estado || "—"}</td>
                          <td className="px-3 py-1.5">
                            {f.errores.length === 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {filas.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3 bg-slate-50">
            <p className="text-xs text-slate-500">
              Se importarán <strong className="text-slate-900">{validas.length}</strong> ítem(s).
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={importando}>
                Cancelar
              </Button>
              <Button
                onClick={confirmarImportacion}
                disabled={importando || validas.length === 0}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {importando ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {validas.length} ítem(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
