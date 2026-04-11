import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock de Supabase cliente ─────────────────────────────────────────────────
// vi.hoisted() permite que las variables estén disponibles en el factory de
// vi.mock(), que se eleva (hoists) al tope del archivo por Vitest.
const { mockSingle, mockOrder, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockOrder = vi.fn(() => ({ single: mockSingle }));
  const mockEq = vi.fn(() => ({ order: mockOrder, single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq, order: mockOrder, single: mockSingle }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockSingle, mockOrder, mockEq, mockSelect, mockFrom };
});

vi.mock('@/lib/supabase/cliente', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

import { oportunidadesService, type Oportunidad, type Match } from '@/modulos/oportunidades/servicio-oportunidades';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const oportunidadFake: Oportunidad = {
  id: 'op-001',
  titulo: 'Mantenimiento eléctrico urgente',
  descripcion: 'Se requiere técnico para revisión del tablero principal',
  categoria_id: 'cat-electrica',
  localidad: 'Burzaco',
  estado: 'abierta',
  empresa_solicitante_id: 'emp-1',
  creado_en: '2026-04-01T10:00:00Z',
  categoria: { nombre: 'Mantenimiento Eléctrico' },
  empresa: { razon_social: 'MetalTech Industrial SA' },
};

const matchFake: Match = {
  id: 'match-001',
  oportunidad_id: 'op-001',
  proveedor_candidato_id: 'prov-1',
  puntaje: 95,
  detalle_puntaje: { tags: 40, categoria: 35, ubicacion: 20 },
  estado: 'sugerido',
  motivo_match: 'Alta compatibilidad por categoría y ubicación',
  oportunidad: oportunidadFake,
  proveedor: {
    nombre_comercial: 'ElectroServicios Sur',
    nombre: 'Juan',
    tipo_proveedor: 'electricista',
  },
};

describe('oportunidadesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear la cadena de mocks para cada test
    mockOrder.mockReturnValue({ single: mockSingle });
    mockEq.mockReturnValue({ order: mockOrder, single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  // ── getOportunidades ────────────────────────────────────────────────────────
  describe('getOportunidades()', () => {
    it('retorna lista de oportunidades cuando Supabase responde OK', async () => {
      mockOrder.mockResolvedValueOnce({ data: [oportunidadFake], error: null });

      const resultado = await oportunidadesService.getOportunidades();

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('op-001');
      expect(resultado[0].titulo).toBe('Mantenimiento eléctrico urgente');
    });

    it('filtra solo oportunidades con estado "abierta" (verifica llamada a .eq)', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getOportunidades();

      expect(mockEq).toHaveBeenCalledWith('estado', 'abierta');
    });

    it('ordena por creado_en descendente', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getOportunidades();

      expect(mockOrder).toHaveBeenCalledWith('creado_en', { ascending: false });
    });

    it('lanza error si Supabase retorna un error', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection lost' },
      });

      await expect(oportunidadesService.getOportunidades()).rejects.toEqual({
        message: 'Database connection lost',
      });
    });
  });

  // ── getOportunidadById ──────────────────────────────────────────────────────
  describe('getOportunidadById()', () => {
    it('retorna la oportunidad correcta por ID', async () => {
      mockSingle.mockResolvedValueOnce({ data: oportunidadFake, error: null });

      const resultado = await oportunidadesService.getOportunidadById('op-001');

      expect(resultado.id).toBe('op-001');
      expect(resultado.estado).toBe('abierta');
    });

    it('filtra por el ID correcto', async () => {
      mockSingle.mockResolvedValueOnce({ data: oportunidadFake, error: null });

      await oportunidadesService.getOportunidadById('op-001');

      expect(mockEq).toHaveBeenCalledWith('id', 'op-001');
    });

    it('lanza error si la oportunidad no existe', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows found' },
      });

      await expect(
        oportunidadesService.getOportunidadById('op-inexistente')
      ).rejects.toEqual({ message: 'No rows found' });
    });
  });

  // ── getMatchesForUser ───────────────────────────────────────────────────────
  describe('getMatchesForUser()', () => {
    it('usa "empresa_candidata_id" para rol company', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getMatchesForUser('emp-1', 'company');

      expect(mockEq).toHaveBeenCalledWith('empresa_candidata_id', 'emp-1');
    });

    it('usa "proveedor_candidato_id" para rol provider', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getMatchesForUser('prov-1', 'provider');

      expect(mockEq).toHaveBeenCalledWith('proveedor_candidato_id', 'prov-1');
    });

    it('ordena por puntaje descendente', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getMatchesForUser('prov-1', 'provider');

      expect(mockOrder).toHaveBeenCalledWith('puntaje', { ascending: false });
    });

    it('retorna los matches del usuario', async () => {
      mockOrder.mockResolvedValueOnce({ data: [matchFake], error: null });

      const resultado = await oportunidadesService.getMatchesForUser('prov-1', 'provider');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].puntaje).toBe(95);
    });

    it('lanza error si Supabase falla', async () => {
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(
        oportunidadesService.getMatchesForUser('prov-1', 'provider')
      ).rejects.toEqual({ message: 'Permission denied' });
    });
  });

  // ── getMatchesForOportunidad ────────────────────────────────────────────────
  describe('getMatchesForOportunidad()', () => {
    it('filtra por oportunidad_id correcto', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getMatchesForOportunidad('op-001');

      expect(mockEq).toHaveBeenCalledWith('oportunidad_id', 'op-001');
    });

    it('ordena por puntaje descendente', async () => {
      mockOrder.mockResolvedValueOnce({ data: [], error: null });

      await oportunidadesService.getMatchesForOportunidad('op-001');

      expect(mockOrder).toHaveBeenCalledWith('puntaje', { ascending: false });
    });

    it('retorna matches con datos del proveedor', async () => {
      mockOrder.mockResolvedValueOnce({ data: [matchFake], error: null });

      const resultado = await oportunidadesService.getMatchesForOportunidad('op-001');

      expect(resultado[0].proveedor?.nombre_comercial).toBe('ElectroServicios Sur');
    });
  });
});
