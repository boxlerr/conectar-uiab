# Respaldo: directorio pre-público (julio 2026)

Código recuperado de los commits anteriores a `9fbc8cb` ("directorio publico 100%")
y `e9ee75d` ("Reseñas"), que sobreescribieron el trabajo previo. Snapshot tomado
del commit `65c82b9` ("carrusel aleatorio", 4 jul 2026).

También existe la rama `respaldo/pre-directorio-publico` apuntando a ese commit,
por si se quiere ver el proyecto completo en ese estado:

```bash
git checkout respaldo/pre-directorio-publico   # ver el estado completo
git checkout main                              # volver
```

## Contenido

| Archivo | Original | Qué tenía |
|---|---|---|
| `directorio-page.tsx` | `src/app/directorio/page.tsx` | Versión client-side con gate de login (`useAuth`): usuarios no logueados veían `PublicEmpresasLanding`; logueados veían el directorio completo con fetch desde el cliente. |
| `empresas-slug-page.tsx` | `src/app/empresas/[slug]/page.tsx` | Ficha de empresa previa, con lógica de contacto según sesión y reseñas a empresas **y proveedores**. |
| `FormularioResena.tsx` | `src/components/ui/directorio/FormularioResena.tsx` | Formulario de reseña que soportaba reseñar proveedores (`proveedor_resenado_id`). |
| `acciones-resenas.ts` | `src/components/ui/directorio/acciones-resenas.ts` | Server actions de reseñas sin el bloqueo a proveedores. |
| `tarjeta-perfil-directorio.tsx` | `src/components/ui/directorio/tarjeta-perfil-directorio.tsx` | Tarjeta de perfil previa al rediseño público. |
| `middleware.ts` | `src/lib/supabase/middleware.ts` | Middleware con `/directorio` como ruta protegida (requería sesión). |

Esta carpeta está excluida del type-check (`tsconfig.json → exclude`) y no se
rutea (está fuera de `src/app`), así que no afecta al build. Es solo material
de referencia para reutilizar.
