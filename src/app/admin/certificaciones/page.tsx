import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Award, ExternalLink, FileText, Paperclip } from "lucide-react";
import { etiquetaNorma } from "@/modulos/certificaciones/normas";

/**
 * Las certificaciones que cargaron las socias, para poder MIRARLAS.
 *
 * Sin botón de aprobar, a propósito. El 21-jul se sacó el concepto de
 * "Verificada por UIAB" por decisión de producto —"la UIAB no verifica ni audita
 * las normas; cada socio elige y carga las que quiera y es su responsabilidad"—
 * y hoy eso está escrito como declaración en las 59 fichas públicas: "La UIAB no
 * emite, verifica ni audita certificaciones". Poner un botón de aprobar acá
 * contradiría ese texto y le pasaría la responsabilidad a la UIAB.
 *
 * Lo que sí faltaba era poder verlas: se cargan desde /perfil/certificaciones y
 * no aparecían en ninguna pantalla del panel.
 */

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Fila = {
  id: string;
  codigo_norma: string;
  nombre_libre: string | null;
  alcance: string | null;
  organismo_certificador: string | null;
  numero_certificado: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  ruta_archivo: string | null;
  nombre_archivo: string | null;
  creado_en: string;
  empresas: { razon_social: string | null; nombre_comercial: string | null } | null;
  proveedores: { nombre: string | null; razon_social: string | null } | null;
};

async function getCertificaciones() {
  const { data, error } = await adminClient()
    .from("certificaciones")
    .select(
      `id, codigo_norma, nombre_libre, alcance, organismo_certificador, numero_certificado,
       fecha_emision, fecha_vencimiento, ruta_archivo, nombre_archivo, creado_en,
       empresas:empresa_id(razon_social, nombre_comercial),
       proveedores:proveedor_id(nombre, razon_social)`
    )
    .order("creado_en", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Fila[];
}

function venceEn(fecha: string | null): { texto: string; alerta: boolean } | null {
  if (!fecha) return null;
  const dias = Math.round((new Date(fecha).getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return { texto: "Vencida", alerta: true };
  if (dias < 90) return { texto: `Vence en ${dias} días`, alerta: true };
  return { texto: `Vence ${new Date(fecha).toLocaleDateString("es-AR")}`, alerta: false };
}

export default async function AdminCertificacionesPage() {
  const filas = await getCertificaciones();

  const conArchivo = filas.filter((c) => c.ruta_archivo).length;
  const porVencer = filas.filter((c) => venceEn(c.fecha_vencimiento)?.alerta).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Award className="w-8 h-8 text-primary-600" />
          Certificaciones
        </h1>
        <p className="text-slate-500 mt-1 max-w-3xl">
          Lo que declaró cada socia desde su panel. La UIAB no las verifica ni las audita —
          así figura en las fichas públicas— así que acá se ven, no se aprueban.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Cargadas", valor: filas.length, pie: "por todas las socias" },
          { label: "Con archivo adjunto", valor: conArchivo, pie: `${filas.length - conArchivo} sin respaldo` },
          { label: "Vencidas o por vencer", valor: porVencer, pie: "en los próximos 90 días" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-5 ring-1 ring-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none mt-1">{s.valor}</p>
            <p className="text-xs text-slate-400 mt-2">{s.pie}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg ring-1 ring-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Norma</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Organismo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vigencia</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">Todavía no cargó certificaciones ninguna socia.</p>
                  </td>
                </tr>
              ) : (
                filas.map((c) => {
                  const quien =
                    c.empresas?.nombre_comercial ||
                    c.empresas?.razon_social ||
                    c.proveedores?.razon_social ||
                    c.proveedores?.nombre ||
                    "Sin ficha";
                  const vig = venceEn(c.fecha_vencimiento);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-sm">{quien}</div>
                        <div className="text-xs text-slate-400">
                          Cargada el {new Date(c.creado_en).toLocaleDateString("es-AR")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-700">
                          {etiquetaNorma(c.codigo_norma, c.nombre_libre)}
                        </div>
                        {c.numero_certificado && (
                          <div className="text-xs text-slate-400">N° {c.numero_certificado}</div>
                        )}
                        {c.alcance && (
                          <div className="text-xs text-slate-400 max-w-xs truncate" title={c.alcance}>
                            {c.alcance}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {c.organismo_certificador || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4">
                        {vig ? (
                          <span className={`text-xs font-semibold ${vig.alerta ? "text-amber-700" : "text-slate-600"}`}>
                            {vig.texto}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">Sin fecha</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.ruta_archivo ? (
                          <Link
                            href={`/api/certificaciones/${c.id}/archivo`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-900"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            {c.nombre_archivo || "Ver archivo"}
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <FileText className="w-3.5 h-3.5" />
                            Sin adjuntar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
