import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolverEntidadDePerfil } from '@/modulos/autenticacion/entidad-del-perfil';

/**
 * Bug reincidente: resolver "de qué ficha soy dueño" ramificando en
 * `rol_sistema === 'company' | 'provider'`.
 *
 * `rol_sistema` son PERMISOS ("soy admin"), no la ficha ("soy Vaxler"). Quien
 * es admin y además dueño de una empresa no cae en ninguna de las dos ramas y
 * termina con las dos entidades en null.
 *
 * Primera vez (julio 2026): /perfil rebotaba al admin a /admin con el panel
 * vacío. Se arregló creando `resolverEntidadDePerfil`, pero el arreglo no se
 * propagó y en agosto reapareció en oportunidades: la cuenta de Julián (admin +
 * dueño de Vaxler) recibía "No estás asociado a ninguna empresa o particular
 * validado" al publicar un requerimiento, teniendo la membresía cargada.
 *
 * Por eso el segundo test es una regla general sobre el código y no una lista
 * de los archivos que fallaron: la lista siempre queda vieja.
 */

/** Supabase de mentira: sólo responde los dos selects que hace el helper. */
function supabaseFalso(filas: {
  miembros_empresa?: { empresa_id: string }[];
  miembros_proveedor?: { proveedor_id: string }[];
}) {
  return {
    from(tabla: string) {
      const data = (filas as Record<string, unknown[]>)[tabla]?.[0] ?? null;
      const constructor = {
        select: () => constructor,
        eq: () => constructor,
        limit: () => constructor,
        maybeSingle: async () => ({ data, error: null }),
      };
      return constructor;
    },
  };
}

describe('la ficha sale de la membresía, no del rol del sistema', () => {
  it('un admin dueño de una empresa resuelve a esa empresa', async () => {
    // El perfil de Julián: rol_sistema 'admin' y membresía real en Vaxler.
    const entidad = await resolverEntidadDePerfil(
      supabaseFalso({ miembros_empresa: [{ empresa_id: 'vaxler' }] }),
      'perfil-julian'
    );

    expect(entidad).toEqual({ tipo: 'company', id: 'vaxler' });
  });

  it('sin ninguna membresía devuelve null', async () => {
    const entidad = await resolverEntidadDePerfil(supabaseFalso({}), 'perfil-suelto');
    expect(entidad).toBeNull();
  });
});

/**
 * Archivos que todavía eligen la tabla de membresía por `rol_sistema`.
 *
 * `middleware.ts` está acá a propósito: es auth-crítico y romperlo deja socios
 * afuera del sitio, así que su reescritura se decidió aparte. Ahí el fallo es
 * permisivo (no encuentra entidad → no chequea suscripción), no un bloqueo.
 * Cualquier archivo NUEVO en esta lista es el bug volviendo.
 */
const EXCEPCIONES = ['src/lib/supabase/middleware.ts'];

describe('regla: nadie más ramifica la ficha por rol_sistema', () => {
  it('ningún archivo elige entre miembros_empresa y miembros_proveedor según el rol', () => {
    const raiz = process.cwd();
    const archivos = archivosFuente(join(raiz, 'src'));

    const infractores = archivos.filter((ruta) => {
      const relativa = ruta.slice(raiz.length + 1);
      if (EXCEPCIONES.includes(relativa)) return false;
      if (relativa.startsWith('src/tests/')) return false;

      // Sin comentarios: varios archivos explican este mismo bug citando el
      // patrón, y esas citas no son el bug.
      const codigo = sinComentarios(readFileSync(ruta, 'utf8'));

      // El patrón del bug: mirar el rol y, en el mismo archivo, salir a buscar
      // la membresía. Contar usuarios por rol (admin/usuarios) no lo dispara,
      // porque no toca las tablas de membresía.
      const ramificaPorRol = /rol_sistema\s*===\s*['"](company|provider)['"]/.test(codigo);
      const buscaMembresia = /miembros_(empresa|proveedor)/.test(codigo);

      return ramificaPorRol && buscaMembresia;
    });

    expect(infractores.map((f) => f.slice(raiz.length + 1))).toEqual([]);
  });
});

/** Saca comentarios de bloque y de línea. Alcanza para este chequeo. */
function sinComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Todos los .ts/.tsx bajo un directorio, sin dependencias externas. */
function archivosFuente(dir: string): string[] {
  const salida: string[] = [];

  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === 'node_modules' || entrada.name.startsWith('.')) continue;
      salida.push(...archivosFuente(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      salida.push(ruta);
    }
  }

  return salida;
}
