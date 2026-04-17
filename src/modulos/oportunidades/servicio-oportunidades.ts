import { createClient, resetClient } from '@/lib/supabase/cliente';

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
  categoria?: { nombre: string };
  empresa?: { razon_social: string };
}

export interface MatchCandidateEmpresa {
  razon_social: string;
  nombre_fantasia?: string | null;
  localidad?: string | null;
  ruta_logo?: string | null;
  bucket_logo?: string | null;
}

export interface MatchCandidateProveedor {
  nombre: string;
  nombre_comercial?: string | null;
  tipo_proveedor: string;
  localidad?: string | null;
  ruta_logo?: string | null;
  bucket_logo?: string | null;
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
<<<<<<< Updated upstream
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades')
        .select(`
          *,
          categoria:categorias(nombre),
          empresa:empresas(razon_social)
        `)
        .eq('estado', 'abierta')
        .order('creado_en', { ascending: false }))(),
      10000,
      'getOportunidades'
    );
=======
    const { data, error } = await supabase
      .from('oportunidades')
      .select(`
        *,
        categoria:categorias(nombre),
        empresa:empresas!oportunidades_empresa_solicitante_id_fkey(razon_social)
      `)
      .eq('estado', 'abierta')
      .order('creado_en', { ascending: false });
>>>>>>> Stashed changes

    if (error) throw error;
    return data as Oportunidad[];
  },

  async getOportunidadById(id: string) {
<<<<<<< Updated upstream
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades')
        .select(`
          *,
          categoria:categorias(nombre),
          empresa:empresas(razon_social)
        `)
        .eq('id', id)
        .single())(),
      10000,
      'getOportunidadById'
    );
=======
    const { data, error } = await supabase
      .from('oportunidades')
      .select(`
        *,
        categoria:categorias(nombre),
        empresa:empresas!oportunidades_empresa_solicitante_id_fkey(razon_social)
      `)
      .eq('id', id)
      .single();
>>>>>>> Stashed changes

    if (error) throw error;
    return data as Oportunidad;
  },

  async getMatchesForUser(userId: string, role: 'company' | 'provider') {
    const supabase = createClient();
    const column = role === 'company' ? 'empresa_candidata_id' : 'proveedor_candidato_id';

<<<<<<< Updated upstream
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades_matches')
        .select(`
          *,
          oportunidad:oportunidades(
            *,
            categoria:categorias(nombre),
            empresa:empresas(razon_social)
          )
        `)
        .eq(column, userId)
        .order('puntaje', { ascending: false }))(),
      10000,
      'getMatchesForUser'
    );
=======
    const { data, error } = await supabase
      .from('oportunidades_matches')
      .select(`
        *,
        oportunidad:oportunidades(
          *,
          categoria:categorias(nombre),
          empresa:empresas!oportunidades_empresa_solicitante_id_fkey(razon_social)
        )
      `)
      .eq(column, userId)
      .order('puntaje', { ascending: false });
>>>>>>> Stashed changes

    if (error) throw error;
    return data as Match[];
  },

  async getMatchesForOportunidad(oportunidadId: string) {
<<<<<<< Updated upstream
    const supabase = createClient();
    const { data, error } = await race(
      (async () => await supabase
        .from('oportunidades_matches')
        .select(`
          *,
          proveedor:proveedores(nombre_comercial, nombre, tipo_proveedor)
        `)
        .eq('oportunidad_id', oportunidadId)
        .order('puntaje', { ascending: false }))(),
      10000,
      'getMatchesForOportunidad'
    );
=======
    const { data, error } = await supabase
      .from('oportunidades_matches')
      .select(`
        *,
        empresa:empresas!oportunidades_matches_empresa_candidata_id_fkey(razon_social, nombre_fantasia, localidad, ruta_logo, bucket_logo),
        proveedor:proveedores!oportunidades_matches_proveedor_candidato_id_fkey(nombre, nombre_comercial, tipo_proveedor, localidad, ruta_logo, bucket_logo)
      `)
      .eq('oportunidad_id', oportunidadId)
      .order('puntaje', { ascending: false });
>>>>>>> Stashed changes

    if (error) throw error;
    return data as Match[];
  }
};
