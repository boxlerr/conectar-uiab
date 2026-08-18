import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import robots from '@/app/robots';
import { tituloDeFicha, TOPE_TITLE_SIN_SUFIJO } from '@/lib/seo/texto';

const APP = join(process.cwd(), 'src', 'app');
const leer = (...tramos: string[]) => readFileSync(join(APP, ...tramos), 'utf8');

/**
 * Rutas públicas que Google debe poder indexar, con el archivo donde vive su
 * metadata. Cada una tiene que declararse canónica de sí misma.
 */
const RUTAS_PUBLICAS: Array<{ ruta: string; archivo: string[] }> = [
  { ruta: '/',                          archivo: ['page.tsx'] },
  { ruta: '/directorio',                archivo: ['directorio', 'page.tsx'] },
  { ruta: '/empresas',                  archivo: ['empresas', 'layout.tsx'] },
  { ruta: '/oportunidades',             archivo: ['oportunidades', 'layout.tsx'] },
  { ruta: '/cooperativas',              archivo: ['cooperativas', 'layout.tsx'] },
  { ruta: '/instituciones-bancarias',   archivo: ['instituciones-bancarias', 'layout.tsx'] },
  { ruta: '/instituciones-educativas',  archivo: ['instituciones-educativas', 'layout.tsx'] },
  { ruta: '/nosotros',                  archivo: ['nosotros', 'page.tsx'] },
  { ruta: '/rubros',                    archivo: ['rubros', 'page.tsx'] },
  { ruta: '/sumate',                    archivo: ['sumate', 'page.tsx'] },
  { ruta: '/contacto',                  archivo: ['contacto', 'page.tsx'] },
  { ruta: '/terminos',                  archivo: ['terminos', 'page.tsx'] },
  { ruta: '/privacidad',                archivo: ['privacidad', 'page.tsx'] },
  { ruta: '/cookies',                   archivo: ['cookies', 'page.tsx'] },
];

describe('canonical', () => {
  /**
   * El bug que dejó el sitio con 10 páginas indexadas de 64.
   *
   * La metadata de Next se hereda hacia abajo, así que un `alternates` en el
   * layout raíz se lo come TODO el sitio: cada ruta salía declarando que la
   * portada era su versión canónica, o sea "soy un duplicado de la home".
   * Google las plegaba contra la portada y no las indexaba. El canonical va en
   * la ruta, nunca en la raíz.
   */
  it('el layout raíz NO declara alternates', () => {
    // Se lee la fuente en vez de importar el módulo: layout.tsx arranca
    // llamando a `next/font/google`, que fuera del build de Next tira
    // "Poppins is not a function".
    const fuente = leer('layout.tsx');
    const metadata = fuente.slice(fuente.indexOf('export const metadata'));
    expect(metadata).not.toMatch(/^\s*alternates:/m);
  });

  it.each(RUTAS_PUBLICAS)('$ruta declara su propio canonical', ({ ruta, archivo }) => {
    const fuente = leer(...archivo);
    expect(fuente).toContain('alternates');
    // El canonical tiene que ser el de la ruta, no el de otra.
    expect(fuente).toMatch(
      new RegExp(`canonical:\\s*\`?["'\`][^"'\`]*${ruta === '/' ? '/"' : ruta}`)
    );
  });

  it('nadie apunta al dominio sin www', () => {
    // Sin los comentarios: varios explican justamente cuál era el apex malo.
    const sinComentarios = (s: string) =>
      s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    for (const { ruta, archivo } of RUTAS_PUBLICAS) {
      // `https://uiabconecta.com` (apex) redirige a www: un canonical hacia una
      // URL que redirige es una señal contradictoria y Google elige por su cuenta.
      expect(sinComentarios(leer(...archivo)), ruta).not.toMatch(
        /https:\/\/uiabconecta\.com/
      );
    }
  });
});

/**
 * Las rutas dinámicas quedaron FUERA de RUTAS_PUBLICAS (que sólo lista
 * estáticas) y ningún test fijaba su canonical/noindex — y son las que más
 * URLs aportan: 59 fichas, 13 rubros y una por oportunidad abierta. El
 * incidente del 09/08 enseñó lo que cuesta un canonical roto en silencio.
 */
describe('rutas dinámicas', () => {
  it('/empresas/[slug] interpola su canonical y marca noindex al slug inexistente', () => {
    const fuente = leer('empresas', '[slug]', 'page.tsx');
    expect(fuente).toMatch(/canonical:\s*`\/empresas\/\$\{slug\}`/);
    expect(fuente).toMatch(/robots:\s*\{[^}]*index:\s*false/);
  });

  it('/empresas/[slug] arma el title con tope (tituloDeFicha)', () => {
    expect(leer('empresas', '[slug]', 'page.tsx')).toContain('tituloDeFicha(');
  });

  it('/rubros/[slug] da 404 real fuera del catálogo y canonical por slug', () => {
    const fuente = leer('rubros', '[slug]', 'page.tsx');
    expect(fuente).toMatch(/dynamicParams\s*=\s*false/);
    expect(fuente).toMatch(/canonical:\s*`\/rubros\/\$\{rubro\.slug\}`/);
  });

  it('/oportunidades/[id] marca noindex a inexistentes y cerradas, con canonical propio', () => {
    const fuente = leer('oportunidades', '[id]', 'layout.tsx');
    expect(fuente).toMatch(/index:\s*false/);
    expect(fuente).toMatch(/canonical:\s*`\/oportunidades\/\$\{id\}`/);
    // Y las abiertas llevan title/description propios: sin esto todas
    // compartían la metadata del listado.
    expect(fuente).toContain('cortarEnPalabra');
  });

  it('/oportunidades/[id] resuelve la oportunidad en el servidor', () => {
    // La página era "use client" con todo detrás de loading=true: Googlebot
    // recibía "Cargando oportunidad..." en una URL sitemapeada e indexable.
    const fuente = leer('oportunidades', '[id]', 'page.tsx');
    expect(fuente).not.toContain('"use client"');
    expect(fuente).toContain('estado');
  });

  it('/oportunidades/nueva es noindex (gate de login con redirect() de RSC)', () => {
    expect(leer('oportunidades', 'nueva', 'layout.tsx')).toMatch(/index:\s*false/);
  });
});

describe('title de ficha con tope', () => {
  const rol = 'Empresa socia UIAB';

  it('con nombre corto entra el contexto completo', () => {
    expect(
      tituloDeFicha({ nombre: 'TECZA', categoria: 'Informática', localidad: 'Burzaco', rol })
    ).toBe('TECZA — Informática en Burzaco');
  });

  it('con nombre y categoría largos va soltando contexto', () => {
    const nombre = 'SERVICIOS DEL PARQUE DE BURZACO DE ALTE. BROWN SRL';
    const resultado = tituloDeFicha({
      nombre,
      categoria: 'Mantenimiento Industrial y Servicios Generales',
      localidad: 'Burzaco',
      rol,
    });
    // El nombre solo ya mide 50: no entra ningún candidato con contexto,
    // pero el nombre jamás se recorta.
    expect(resultado).toBe(nombre);
  });

  it('nunca supera el presupuesto salvo que el nombre solo ya lo supere', () => {
    const casos = [
      { nombre: 'ROGUANT S.R.L.', categoria: 'Elementos de Protección Personal para la Industria', localidad: 'Burzaco' },
      { nombre: 'ALIMENTOS FRANSRO', categoria: 'Elaboración de Pastas', localidad: 'Burzaco' },
      { nombre: 'A. D. BARBIERI S.A.', categoria: null, localidad: null },
    ];
    for (const c of casos) {
      const titulo = tituloDeFicha({ ...c, rol });
      const presupuesto = Math.max(TOPE_TITLE_SIN_SUFIJO, c.nombre.length);
      expect(titulo.length, titulo).toBeLessThanOrEqual(presupuesto);
      expect(titulo.startsWith(c.nombre), titulo).toBe(true);
    }
  });
});

describe('robots.txt', () => {
  const reglas = robots().rules as { allow?: string; disallow?: string[] };

  /**
   * `Disallow` bloquea el RASTREO, no la indexación: Google no entra, nunca ve
   * el `noindex` y si la URL está linkeada desde una página pública la lista
   * igual. `/register` está linkeado 7 veces desde la home y las fichas, y por
   * eso Search Console lo reportó como "Bloqueada por robots.txt" el 05/08/2026.
   * Lo que no debe indexarse se marca con `noindex`, no se bloquea.
   */
  it.each(['/register', '/login', '/sumate', '/suscripcion', '/directorio', '/empresas'])(
    'no bloquea %s',
    (ruta) => {
      expect(reglas.disallow ?? []).not.toContain(ruta);
    }
  );

  it('sólo bloquea /api/', () => {
    expect(reglas.disallow).toEqual(['/api/']);
  });

  it('nunca bloquea la raíz', () => {
    expect(reglas.disallow ?? []).not.toContain('/');
    expect(reglas.allow).toBe('/');
  });

  it('publica el sitemap', () => {
    expect(robots().sitemap).toBe('https://www.uiabconecta.com/sitemap.xml');
  });
});

describe('noindex', () => {
  it('el grupo (auth) se marca noindex en vez de bloquearse', () => {
    const fuente = leer('(auth)', 'layout.tsx');
    expect(fuente).toMatch(/robots:\s*\{[^}]*index:\s*false/);
    // `follow` para no cortar el flujo de link equity hacia el directorio.
    expect(fuente).toMatch(/follow:\s*true/);
  });

  it('las áreas privadas llevan X-Robots-Tag por cabecera', () => {
    const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
    expect(config).toContain('X-Robots-Tag');
    for (const ruta of [
      '/admin/:path*',
      '/perfil/:path*',
      '/panel-de-control/:path*',
      // Estas tres estaban en next.config.ts pero no acá: el test no se
      // enteraba si alguien las sacaba.
      '/suscripcion/:path*',
      '/pendiente-aprobacion',
      '/403',
    ]) {
      expect(config).toContain(ruta);
    }
  });
});

describe('rutas retiradas', () => {
  /**
   * `redirect()` de next/navigation dentro de un Server Component NO es un
   * redirect HTTP: Next devuelve 200 con un `<meta http-equiv="refresh">`, que
   * Google trata como "soft redirect" y rastrea como si fuera una página. El
   * redirect de /proveedores tiene que vivir en next.config.ts para ser un 308.
   */
  it('/proveedores ya no es una ruta de la app', () => {
    expect(existsSync(join(APP, 'proveedores'))).toBe(false);
  });

  it('/proveedores redirige de forma permanente desde la config', () => {
    const config = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');
    expect(config).toMatch(/source:\s*["']\/proveedores["']/);
    expect(config).toMatch(/source:\s*["']\/proveedores\/:slug["']/);
  });
});

describe('middleware', () => {
  it('no intercepta robots.txt ni sitemap.xml', () => {
    const fuente = readFileSync(join(process.cwd(), 'src', 'middleware.ts'), 'utf8');
    const matcher = fuente.slice(fuente.indexOf('matcher'));
    expect(matcher).toMatch(/robots\\+\.txt/);
    expect(matcher).toMatch(/sitemap\\+\.xml/);
  });
});
