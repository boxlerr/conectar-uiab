import { createClient, resetClient } from '@/lib/supabase/cliente';
import {
  SELECT_OPORTUNIDAD,
  type EmpresaSolicitante,
  type ProveedorSolicitante,
} from './solicitante';

export interface Oportunidad {
  id: string;
  titulo: string;
  descripcion: string;
  categoria_id: string;
  localidad: string;
  estado: string;
  empresa_solicitante_id?: string;
  proveedor_solicitante_id?: string;
  cantidad?: number | null;
  unidad?: string | null;
  fecha_necesidad?: string | null;
  creado_en: string;
  /** Llegan por el `*` del SELECT; el tipo las omitía. */
  visibilidad?: string;
  tipo_requerimiento?: string[] | null;
  categoria?: { nombre: string };
  /** Trae las columnas del logo: la cartelera muestra la marca de quien publica. */
  empresa?: EmpresaSolicitante | null;
  proveedor?: ProveedorSolicitante | null;
  oportunidades_tags?: { tags: { nombre: string } | null }[] | null;
}

/** Datos de contacto que la tarjeta de candidato ofrece como acceso directo. */
export interface ContactoCandidato {
  email?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
}

export interface MatchCandidateEmpresa extends ContactoCandidato {
  razon_social: string;
  nombre_comercial?: string | null;
  localidad?: string | null;
  ruta_logo?: string | null;
  bucket_logo?: string | null;
  empresas_tags?: { tags: { nombre: string } | null }[] | null;
}

export interface MatchCandidateProveedor extends ContactoCandidato {
  nombre: string;
  /** Hace falta para el slug de la ficha: `/empresas/[slug]` resuelve a los
   *  prestadores por `nombre_comercial || nombre + apellido`. */
  apellido?: string | null;
  nombre_comercial?: string | null;
  tipo_proveedor: string;
  localidad?: string | null;
  ruta_logo?: string | null;
  bucket_logo?: string | null;
  proveedores_tags?: { tags: { nombre: string } | null }[] | null;
}

export interface Match {
  id: string;
  oportunidad_id: string;
  empresa_candidata_id?: string | null;
  proveedor_candidato_id?: string | null;
  puntaje: number;
  detalle_puntaje: {
    tags: number;
    categoria: number;
    ubicacion: number;
  };
  estado: string;
  motivo_match: string;
  oportunidad?: Oportunidad;
  empresa?: MatchCandidateEmpresa | null;
  proveedor?: MatchCandidateProveedor | null;
}

// Timeout para queries: si Supabase queda colgado (token inválido, red caída),
// rechazamos en 10s para que la UI muestre error en vez de skeleton infinito.
async function race<T>(work: Promise<T>, ms = 10000, label = 'query'): Promise<T> {
  const start = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, rej) => {
    timer = setTimeout(() => {
      console.error(`[supabase] TIMEOUT tras ${ms}ms en ${label} — probable lock huérfano de navigator.locks. Reciclando cliente.`);
      // Reset del singleton: próximo createClient() construye uno nuevo sin
      // la cola de locks muertos.
      resetClient();
      rej(new Error(`Supabase query timeout (${label})`));
    }, ms);
  });
  try {
    const result = await Promise.race([work, timeoutPromise]);
    const elapsed = Date.now() - start;
    if (elapsed > 2000) {
      console.warn(`[supabase] ${label} tardó ${elapsed}ms (lento)`);
    }
    return result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const oportunidadesService = {
  async getOportunidades() {
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades')
        .select(SELECT_OPORTUNIDAD)
        .eq('estado', 'abierta')
        .order('creado_en', { ascending: false }))(),
      10000,
      'getOportunidades'
    );

    if (error) throw error;
    return data as Oportunidad[];
  },

  async getOportunidadById(id: string) {
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades')
        .select(`
          ${SELECT_OPORTUNIDAD},
          oportunidades_tags ( tags ( nombre ) )
        `)
        .eq('id', id)
        .single())(),
      10000,
      'getOportunidadById'
    );

    if (error) throw error;
    return data as Oportunidad;
  },

  async getMatchesForUser(userId: string, role: 'company' | 'provider') {
    const supabase = createClient();
    const column = role === 'company' ? 'empresa_candidata_id' : 'proveedor_candidato_id';

    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades_matches')
        .select(`
          *,
          oportunidad:oportunidades(${SELECT_OPORTUNIDAD})
        `)
        .eq(column, userId)
        .order('puntaje', { ascending: false }))(),
      10000,
      'getMatchesForUser'
    );

    if (error) throw error;
    return data as Match[];
  },

  async getMatchesForOportunidad(oportunidadId: string) {
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades_matches')
        .select(`
          *,
          empresa:empresas!oportunidades_matches_empresa_candidata_id_fkey(razon_social, nombre_comercial, localidad, ruta_logo, bucket_logo, email, telefono, whatsapp, empresas_tags ( tags ( nombre ) )),
          proveedor:proveedores!oportunidades_matches_proveedor_candidato_id_fkey(nombre, apellido, nombre_comercial, tipo_proveedor, localidad, ruta_logo, bucket_logo, email, telefono, whatsapp, proveedores_tags ( tags ( nombre ) ))
        `)
        .eq('oportunidad_id', oportunidadId)
        .order('puntaje', { ascending: false }))(),
      10000,
      'getMatchesForOportunidad'
    );

    if (error) throw error;
    return data as Match[];
  },

  /**
   * Promedio y cantidad de reseñas APROBADAS por empresa. Para las tarjetas de
   * candidatos: sólo se pintan estrellas si hay reseñas reales — con la base
   * casi sin reseñas esto devuelve un mapa vacío y la tarjeta muestra las
   * etiquetas en común en su lugar (nunca un puntaje inventado).
   */
  async getResenasDeEmpresas(empresaIds: string[]) {
    const resultado = new Map<string, { promedio: number; total: number }>();
    if (empresaIds.length === 0) return resultado;

    const supabase = createClient();
    const { data, error } = await race(
      (async () =>
        await supabase
          .from('resenas')
          .select('empresa_resenada_id, calificacion')
          .eq('estado', 'aprobada')
          .in('empresa_resenada_id', empresaIds))(),
      10000,
      'getResenasDeEmpresas'
    );

    if (error || !data) return resultado;

    const porEmpresa = new Map<string, number[]>();
    for (const fila of data as { empresa_resenada_id: string; calificacion: number }[]) {
      if (!fila.empresa_resenada_id || typeof fila.calificacion !== 'number') continue;
      const lista = porEmpresa.get(fila.empresa_resenada_id) ?? [];
      lista.push(fila.calificacion);
      porEmpresa.set(fila.empresa_resenada_id, lista);
    }
    for (const [empresaId, calificaciones] of porEmpresa) {
      const suma = calificaciones.reduce((total, valor) => total + valor, 0);
      resultado.set(empresaId, {
        promedio: Number((suma / calificaciones.length).toFixed(1)),
        total: calificaciones.length,
      });
    }
    return resultado;
  }
};
