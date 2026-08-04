-- ─────────────────────────────────────────────────────────────────────────────
--  `empresas.es_socia_uiab`: ser socia deja de depender de un dato opcional
-- ─────────────────────────────────────────────────────────────────────────────
--
--  Hasta ahora el criterio de "es socia UIAB" (acceso bonificado, no pasa por el
--  checkout de Mercado Pago) era `empresas.n_socio is not null`. El problema es
--  que `n_socio` es un campo OPCIONAL del formulario de /sumate: el alta exige
--  tildar `ya_es_socio`, pero ese booleano nunca se persistía en `empresas` —
--  sólo se copiaba el número de socia si la persona se acordaba de escribirlo.
--
--  Consecuencia en producción (2026-08-04): 9 empresas socias quedaron con
--  `n_socio` en NULL y el sistema las trataba como altas nuevas arancealdas. A
--  Pinturería Giannoni le pedía pagar la suscripción para poder aprobarla.
--
--  A partir de acá el permiso vive en su propia columna y `n_socio` vuelve a ser
--  lo que dice su nombre: un número de referencia, no un permiso.

alter table public.empresas
  add column if not exists es_socia_uiab boolean not null default false;

comment on column public.empresas.es_socia_uiab is
  'True = socia de la UIAB. Acceso bonificado: no pasa por el checkout y su suscripción se crea como cortesía. Se persiste desde `ya_es_socio` del alta de /sumate. NO usar `n_socio` para decidir esto: es un número de referencia opcional.';

-- ── Backfill 1: toda ficha con número de socia es socia. Sin ambigüedad.
update public.empresas
   set es_socia_uiab = true
 where n_socio is not null
   and es_socia_uiab = false;

-- ── Backfill 2: las 6 socias cargadas a mano el 2026-08-02 desde el documento
--    de modificaciones de la UIAB (commit c9f2776, "Alta de 6 socias nuevas con
--    su logo"). Entraron por SQL directo, así que nunca pasaron por el alta y
--    quedaron sin `n_socio`.
--
--    Se listan por nombre a propósito, en vez de "todas las que no tienen
--    n_socio": ese criterio también alcanzaría a Vaxler (la desarrolladora de la
--    plataforma) y a la cuenta demo, que no son socias.
update public.empresas
   set es_socia_uiab = true
 where estado = 'aprobada'
   and es_socia_uiab = false
   and razon_social in (
     'Pinturería Giannoni',
     'Seguridad Líderes',
     'Mafalda',
     'Branch Ingeniería',
     'Transporte Gav',
     'Grupo Ceta'
   );

-- ── Índice parcial: el gate de cobro y el panel de admin filtran por esta
--    columna en cada carga. La tabla es chica hoy, pero el índice es barato.
create index if not exists empresas_es_socia_uiab_idx
  on public.empresas (es_socia_uiab)
  where es_socia_uiab = true;
