-- Marca de moderación para las etiquetas propuestas por socios.
-- `revisada=true` significa que el admin ya la miró y decidió NO subirla al
-- padrón (administrado_por_admin sigue false). NO se borra: la socia la sigue
-- usando en su ficha y cuenta para el match. Sólo sale de la cola de "Propuestas".
alter table public.tags
  add column if not exists revisada boolean not null default false;

-- Las que ya están en el catálogo oficial se consideran revisadas.
update public.tags set revisada = true where administrado_por_admin = true and revisada = false;
