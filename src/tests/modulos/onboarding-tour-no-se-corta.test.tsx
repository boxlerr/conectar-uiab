import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * Verifica el fix del item 2.1 del reporte de Lucas (2026-08-03): "el tutorial
 * guiado se corta a mitad de recorrido".
 *
 *   CAUSA RAÍZ: joyride corre en modo controlado (el `stepIndex` lo maneja el
 *   provider). Cuando el target de un paso no existe, joyride avisa con
 *   `error:target_not_found` y no avanza por su cuenta. Ese evento no estaba
 *   manejado, así que el recorrido quedaba congelado: overlay gris puesto, sin
 *   tooltip y sin botón para seguir. Pasa de verdad porque varias secciones del
 *   panel se renderizan condicionalmente (dash-matches y dash-items sólo para
 *   company/provider).
 *
 *   FIX: manejar el evento y saltar al próximo paso mostrable; si no queda
 *   ninguno, cerrar el tour prolijo en lugar de dejarlo colgado.
 *
 * El test monta el provider de verdad y reemplaza sólo a joyride, para capturar
 * el `stepIndex` que el provider le pasa en cada render.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

interface PropsJoyride {
  steps: Array<{ target: unknown }>;
  run: boolean;
  stepIndex: number;
  onEvent: (data: unknown, controls: unknown) => void;
}

const { propsJoyride, usuarioFalso } = vi.hoisted(() => ({
  propsJoyride: { actual: null as PropsJoyride | null },
  // Estable a propósito: el provider tiene un efecto que hace
  // setVistosLocal(currentUser?.tutorialesVistos) con esa prop como dependencia.
  // Si el mock devuelve un objeto nuevo por render, el efecto se re-dispara
  // solo y el render entra en loop hasta comerse la memoria del worker.
  usuarioFalso: {
    currentUser: { id: 'u1', role: 'company', tutorialesVistos: {} },
    loading: false,
  },
}));

// next/dynamic devuelve el componente ya resuelto: nos salteamos el joyride real
// (toca el DOM y posiciona con floating-ui) y sólo espiamos sus props.
vi.mock('next/dynamic', () => ({
  default: () =>
    function JoyrideEspia(props: PropsJoyride) {
      propsJoyride.actual = props;
      return null;
    },
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/panel-de-control',
  useRouter: () => ({ push: mockPush, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/modulos/autenticacion/contexto-autenticacion', () => ({
  useAuth: () => usuarioFalso,
}));

vi.mock('@/modulos/onboarding/acciones', () => ({
  marcarTourVisto: vi.fn(async () => ({ ok: true, tutorialesVistos: {} })),
  resetearTour: vi.fn(async () => ({ ok: true, tutorialesVistos: {} })),
}));

// El provider precarga una empresa y una oportunidad de muestra. Devolvemos
// vacío: no hace falta para el tour del panel.
vi.mock('@/lib/supabase/cliente', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({ limit: () => ({ maybeSingle: async () => ({ data: null }) }) }),
        }),
      }),
    }),
  }),
}));

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import { TourProvider, useTour } from '@/modulos/onboarding/contexto-tour';
import { pasosDashboard } from '@/modulos/onboarding/pasos/pasos-dashboard';
import { pasosPerfil } from '@/modulos/onboarding/pasos/pasos-perfil';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Índice de un paso del tour del panel por su atributo data-tour. */
function indiceDe(dataTour: string): number {
  const i = pasosDashboard.findIndex((p) => p.target === `[data-tour="${dataTour}"]`);
  if (i === -1) throw new Error(`El tour del panel no tiene un paso para ${dataTour}`);
  return i;
}

/**
 * Pinta sólo las secciones del panel que le pasemos, en un contenedor propio.
 * Va aparte y no con `document.body.innerHTML`: eso borraría el root que montó
 * testing-library y React entra en un loop de reconciliación (se come la RAM
 * hasta que el worker muere).
 */
let contenedorSecciones: HTMLDivElement | null = null;

function renderizarSecciones(...dataTours: string[]) {
  contenedorSecciones = document.createElement('div');
  contenedorSecciones.innerHTML = dataTours
    .map((t) => `<section data-tour="${t}">contenido</section>`)
    .join('');
  document.body.appendChild(contenedorSecciones);
}

function limpiarSecciones() {
  contenedorSecciones?.remove();
  contenedorSecciones = null;
}

let disparar: (id: 'dashboard') => Promise<void>;

function Sonda() {
  const { iniciarTour } = useTour();
  disparar = iniciarTour;
  return null;
}

async function montarYArrancar() {
  render(
    <TourProvider>
      <Sonda />
    </TourProvider>
  );
  await act(async () => {
    await disparar('dashboard');
  });
  await waitFor(() => expect(propsJoyride.actual?.run).toBe(true));
}

/** Simula el aviso de joyride de que el paso `index` no tiene target. */
async function targetNoEncontrado(index: number) {
  const onEvent = propsJoyride.actual!.onEvent;
  await act(async () => {
    onEvent({ type: 'error:target_not_found', action: 'update', index, status: 'running' }, {});
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('El tutorial no se corta cuando falta una sección del panel', () => {
  beforeEach(() => {
    propsJoyride.actual = null;
    mockPush.mockClear();
  });

  afterEach(() => {
    limpiarSecciones();
    vi.clearAllMocks();
  });

  it('avanza al próximo paso existente en vez de quedarse congelado', async () => {
    // Un panel sin matches ni catálogo cargado: esas secciones no están.
    renderizarSecciones('dash-hero', 'dash-kpis', 'dash-quick', 'dash-explore');
    await montarYArrancar();

    const roto = indiceDe('dash-matches');
    await targetNoEncontrado(roto);

    // Antes del fix se quedaba clavado en `roto`.
    expect(propsJoyride.actual!.stepIndex).not.toBe(roto);
    expect(propsJoyride.actual!.stepIndex).toBe(indiceDe('dash-quick'));
    // Y sigue corriendo: el socio ve el paso siguiente, no un overlay muerto.
    expect(propsJoyride.actual!.run).toBe(true);
  });

  it('cierra el tour cuando ya no queda ningún paso mostrable', async () => {
    // Sólo las secciones previas: después del paso roto no hay nada que mostrar.
    renderizarSecciones('dash-hero', 'dash-kpis');
    await montarYArrancar();

    // Arrancamos del último paso apuntado, así ni el cierre centrado queda.
    await targetNoEncontrado(pasosDashboard.length - 1);

    await waitFor(() => expect(propsJoyride.actual!.run).toBe(false));
  });

  it('llega hasta el paso centrado final, que siempre existe (target body)', async () => {
    renderizarSecciones('dash-hero');
    await montarYArrancar();

    await targetNoEncontrado(indiceDe('dash-kpis'));

    // El cierre del tour usa target "body": es el próximo mostrable.
    expect(propsJoyride.actual!.stepIndex).toBe(pasosDashboard.length - 1);
    expect(propsJoyride.actual!.run).toBe(true);
  });

  it('no navega a otra ruta: los pasos del panel viven todos en /panel-de-control', async () => {
    renderizarSecciones('dash-hero', 'dash-quick');
    await montarYArrancar();

    await targetNoEncontrado(indiceDe('dash-matches'));

    expect(mockPush).not.toHaveBeenCalled();
  });
});

/**
 * Pedido de Julián sobre el recorrido: el tutorial tiene que dejar cargar un
 * dato mientras te lo explica, de forma opcional, y seguir. Los clicks ya
 * atraviesan el spotlight por default, pero la trampa de foco de joyride
 * devolvía el foco al tooltip y no se podía tipear en el campo.
 */
describe('Se puede cargar un dato sin cerrar el tutorial', () => {
  const porTitulo = (titulo: string) => {
    const paso = pasosPerfil.find((p) => p.title === titulo);
    if (!paso) throw new Error(`No hay paso con título "${titulo}"`);
    return paso;
  };

  const PASOS_CARGABLES = [
    'Subí tu logotipo',
    'Tu información principal',
    'No te olvides de guardar',
    'Añadir un ítem',
    'Importar desde Excel',
  ];

  it.each(PASOS_CARGABLES)('en "%s" el socio puede usar el campo y seguir', (titulo) => {
    const paso = porTitulo(titulo);
    // Sin esto el foco vuelve al tooltip y no se puede escribir.
    expect(paso.disableFocusTrap).toBe(true);
    // Y el recorte del spotlight tiene que dejar pasar el click.
    expect(paso.blockTargetInteraction).toBe(false);
  });

  it('los pasos que sólo explican mantienen la trampa de foco', () => {
    // Accesibilidad: en un paso sin nada que tocar, el teclado debe quedar
    // dentro del tooltip. Por eso no se activa global.
    const soloExplica = porTitulo('Menú de tu panel');
    expect(soloExplica.disableFocusTrap).toBeUndefined();
  });

  it('el formulario de datos se explica apuntando al form, no a un campo suelto', () => {
    // El spotlight tiene que abarcar todos los inputs para poder completarlos.
    expect(porTitulo('Tu información principal').target).toBe('[data-tour="datos-form"]');
  });
});
