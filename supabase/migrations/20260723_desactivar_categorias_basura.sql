-- Desactiva filas basura de `public.categorias` que se colaron al importar una
-- tabla markdown (encabezado/separador), y que hoy aparecen como opciones vacías
-- o "-------" en el filtro del directorio y en /perfil/servicios.
-- Reversible: sólo marca activa=false, no borra.

update public.categorias
set activa = false
where trim(coalesce(nombre, '')) = ''
   or slug in ('**TOTAL**', '--------')
   or nombre ~ '^[:\-\s|]+$';
