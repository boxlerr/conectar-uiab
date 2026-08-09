import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Cada sesión de Claude Code crea un worktree en .claude/worktrees/. Son
    // copias completas del repo, así que vitest encontraba ahí una segunda (y
    // tercera) versión de cada test: las de worktrees viejos siguen esperando
    // reglas que ya cambiamos y `npm test` fallaba con la suite real en verde.
    // Se testea el árbol actual, no las sesiones abandonadas.
    //
    // configDefaults.exclude va sí o sí: `exclude` REEMPLAZA a los defaults,
    // no se suma. Sin esto vitest se pone a barrer node_modules.
    exclude: [...configDefaults.exclude, '**/.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/tests/**',
        'src/app/**',          // Next.js pages - no testeable sin servidor
        'src/components/ui/**', // Shadcn UI - código de terceros
        '**/*.d.ts',
      ],
    },
  },
});
