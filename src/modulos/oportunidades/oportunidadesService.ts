import { createClient } from '@/lib/supabase/client';

export interface Oportunidad {
  id: string;
  titulo: string;
  descripcion: string;
  categoria_id: string;
  localidad: string;
  estado: string;
  empresa_solicitante_id?: string;
  proveedor_solicitante_id?: string;
  creado_en: string;
  // Join fields
  categoria?: { nombre: string };
  empresa?: { razon_social: string };
}

export interface Match {
  id: string;
  oportunidad_id: string;
  empresa_candidata_id?: string;
  proveedor_candidato_id?: string;
  puntaje: number;
  detalle_puntaje: {
    tags: number;
    categoria: number;
    ubicacion: number;
  };
  estado: string;
  motivo_match: string;
  oportunidad?: Oportunidad;
  proveedor?: {
    nombre_comercial: string;
    nombre: string;
    tipo_proveedor: string;
  };
}

const supabase = createClient();

export const oportunidadesService = {
  async getOportunidades() {
    const { data, error } = await supabase
      .from('oportunidades')
      .select(`
        *,
        categoria:categorias(nombre),
        empresa:empresas(razon_social)
      `)
      .eq('estado', 'abierta')
      .order('creado_en', { ascending: false });

    if (error) throw error;
    return data as Oportunidad[];
  },

  async getOportunidadById(id: string) {
    const { data, error } = await supabase
      .from('oportunidades')
      .select(`
        *,
        categoria:categorias(nombre),
        empresa:empresas(razon_social)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Oportunidad;
  },

  async getMatchesForUser(userId: string, role: 'company' | 'provider') {
    const column = role === 'company' ? 'empresa_candidata_id' : 'proveedor_candidato_id';
    
    const { data, error } = await supabase
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
      .order('puntaje', { ascending: false });

    if (error) throw error;
    return data as Match[];
  },

  async getMatchesForOportunidad(oportunidadId: string) {
    const { data, error } = await supabase
      .from('oportunidades_matches')
      .select(`
        *,
        proveedor:proveedores(nombre_comercial, nombre, tipo_proveedor)
      `)
      .eq('oportunidad_id', oportunidadId)
      .order('puntaje', { ascending: false });

    if (error) throw error;
    return data as Match[];
  }
};
