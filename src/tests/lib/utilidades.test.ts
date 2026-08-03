import { describe, it, expect } from 'vitest';
import { cn, normalizarSitioWeb, pareceEmail } from '@/lib/utilidades';

describe('cn() — combinador de clases Tailwind', () => {
  it('combina múltiples clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignora valores falsy (undefined, null, false)', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('resuelve conflictos de Tailwind (la última clase gana)', () => {
    // tailwind-merge debe resolver: p-2 vs p-4 → p-4 gana
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('resuelve conflictos de color', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('maneja objetos condicionales (clsx)', () => {
    expect(cn({ 'font-bold': true, 'italic': false })).toBe('font-bold');
  });

  it('maneja arrays anidados', () => {
    expect(cn(['px-2', 'py-1'], 'text-sm')).toBe('px-2 py-1 text-sm');
  });

  it('devuelve string vacío cuando no hay argumentos', () => {
    expect(cn()).toBe('');
  });

  it('devuelve string vacío con solo valores falsy', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  it('mantiene clases que no son de Tailwind', () => {
    expect(cn('mi-clase-custom', 'otra-clase')).toBe('mi-clase-custom otra-clase');
  });
});

// Item 2.2 del reporte de errores de Lucas (2026-08-03): el campo Sitio Web
// rechazaba "www.metlongchamps.com" con el cartel nativo del browser
// ("Introduce una URL") y bloqueaba el guardado del formulario entero. La
// validación estricta se cambió por esta normalización, que ahora corre en los
// 4 formularios que piden la web y en cada href que la renderiza.
describe('normalizarSitioWeb() — la web como la tipean los socios', () => {
  it('agrega https:// cuando falta el esquema', () => {
    expect(normalizarSitioWeb('www.metlongchamps.com')).toBe('https://www.metlongchamps.com');
    expect(normalizarSitioWeb('miempresa.com.ar')).toBe('https://miempresa.com.ar');
  });

  it('respeta el esquema que ya venía, sin forzar https', () => {
    expect(normalizarSitioWeb('http://miempresa.com.ar')).toBe('http://miempresa.com.ar');
    expect(normalizarSitioWeb('https://vaxler.com.ar')).toBe('https://vaxler.com.ar');
  });

  it('no duplica el esquema ni se confunde con mayúsculas', () => {
    // "Www.adbarbieri.com" es un valor real cargado desde /sumate.
    expect(normalizarSitioWeb('Www.adbarbieri.com')).toBe('https://Www.adbarbieri.com');
    expect(normalizarSitioWeb('HTTPS://miempresa.com')).toBe('HTTPS://miempresa.com');
  });

  it('devuelve null para lo que no es una web, así no se guarda basura', () => {
    expect(normalizarSitioWeb('')).toBeNull();
    expect(normalizarSitioWeb('   ')).toBeNull();
    expect(normalizarSitioWeb(null)).toBeNull();
    expect(normalizarSitioWeb(undefined)).toBeNull();
  });

  it('limpia espacios y barras sueltas al principio', () => {
    expect(normalizarSitioWeb('  www.empresa.com  ')).toBe('https://www.empresa.com');
    expect(normalizarSitioWeb('//www.empresa.com')).toBe('https://www.empresa.com');
  });
});

// Item 2.3 del reporte de Lucas: "el mensaje de error se muestra como aviso
// nativo del navegador. El cartel emergente tapa el bloque Sede Principal y
// desaparece solo". Salía de los type="email" del formulario de datos, que
// además bloqueaban el submit completo. Ahora validamos nosotros y el mensaje va
// en línea, así que el validador tiene que ser permisivo pero no inútil.
describe('pareceEmail() — para no depender del cartel nativo del browser', () => {
  it('acepta correos normales', () => {
    expect(pareceEmail('info@metlongchamps.com')).toBe(true);
    expect(pareceEmail('cotizaciones@metlongchamps.com.ar')).toBe(true);
    expect(pareceEmail('nombre.apellido+ventas@sub.dominio.com')).toBe(true);
  });

  it('rechaza lo que seguro no es un correo', () => {
    expect(pareceEmail('metlongchamps.com')).toBe(false); // sin arroba
    expect(pareceEmail('info@')).toBe(false);             // sin dominio
    expect(pareceEmail('info@localhost')).toBe(false);    // dominio sin punto
    expect(pareceEmail('@metlongchamps.com')).toBe(false);
    expect(pareceEmail('info@@metlongchamps.com')).toBe(false);
  });

  it('rechaza espacios, que es el typo más común al pegar', () => {
    expect(pareceEmail('info @metlongchamps.com')).toBe(false);
    expect(pareceEmail('info@met longchamps.com')).toBe(false);
  });

  it('ignora espacios de sobra alrededor', () => {
    expect(pareceEmail('  info@metlongchamps.com  ')).toBe(true);
  });

  it('vacío es false: lo obligatorio/opcional lo decide el formulario', () => {
    expect(pareceEmail('')).toBe(false);
    expect(pareceEmail('   ')).toBe(false);
    expect(pareceEmail(null)).toBe(false);
    expect(pareceEmail(undefined)).toBe(false);
  });
});
