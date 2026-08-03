-- Item 3.2 del reporte de errores de Lucas (2026-08-03): "errores de tipeo en el
-- catálogo oficial (...) corresponde revisar las subcategorías de Metalmecánica
-- y Metalurgia y el resto del árbol de rubros".
--
-- Las subcategorías de Metalmecánica ya se corrigieron en
-- 20260802_split_rubros_metalmecanica.sql (Herrería Industrial + Cerrajería
-- Industrial, bien escritas y separadas). Esto cierra "el resto del árbol":
-- rubros sin tilde que se ven mal en el directorio y en la ficha pública, y dos
-- slugs con caracteres que no corresponden a un slug (ñ y tilde).
--
-- Se RENOMBRA, nunca se borra ni se recrea: las tablas pivote
-- (empresas_categorias, proveedores_categorias) apuntan al id, así que un
-- delete+insert desvincularía a las socias ya categorizadas.

begin;

-- ── Nombres sin tilde ────────────────────────────────────────────────────────
-- Se filtra además por slug para no pisar una especialidad libre que un socio
-- haya propuesto con el mismo texto (esas van con administrado_por_admin=false
-- y no son padrón todavía).
update categorias set nombre = 'Ferretería y Corralón', actualizado_en = now()
 where slug = 'ferreteria-corralon' and nombre = 'Ferreteria y Corralón';

update categorias set nombre = 'Cafetería y Bar', actualizado_en = now()
 where slug = 'cafeteria-bar' and nombre = 'Cafeteria y Bar';

update categorias set nombre = 'Panadería y Pastelería', actualizado_en = now()
 where slug = 'panaderia-pasteleria' and nombre = 'Panaderia y Pasteleria';

update categorias set nombre = 'Restaurante y Rotisería', actualizado_en = now()
 where slug = 'restaurant-rotiseria' and nombre = 'Restaurant y Rotiseria';

update categorias set nombre = 'Estética y Belleza', actualizado_en = now()
 where slug = 'estetica-belleza' and nombre = 'Estetica y Belleza';

update categorias set nombre = 'Farmacia y Óptica', actualizado_en = now()
 where slug = 'farmacia-optica' and nombre = 'Farmacia y Optica';

update categorias set nombre = 'Gomería', actualizado_en = now()
 where slug = 'gomeria' and nombre = 'Gomeria';

-- ── Slugs con caracteres inválidos ───────────────────────────────────────────
-- Un slug va sin tildes ni ñ: viaja en URLs y en filtros del directorio.
-- Ninguno de los dos está hardcodeado en el código (verificado), así que
-- renombrarlos no rompe nada.
update categorias set slug = 'packaging-diseno-industrial', actualizado_en = now()
 where slug = 'packaging-diseño-industrial';

update categorias set slug = 'transporte-frigorifico', actualizado_en = now()
 where slug = 'transporte-frigorífico';

commit;
