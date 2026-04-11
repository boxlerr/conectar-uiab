import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utilidades';

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
