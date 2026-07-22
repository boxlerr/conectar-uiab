-- Amplía el catálogo curado de etiquetas (`public.tags`, administrado_por_admin=true)
-- con rubros/materiales/servicios que faltaban, para mejorar el match de
-- oportunidades y lo que la socia puede tildar en /perfil/etiquetas.
-- Idempotente: ON CONFLICT DO NOTHING cubre tanto tags_slug_key como tags_nombre_key.
-- slug = minúsculas sin tildes con guiones (regla de slugEtiqueta()).

insert into public.tags (nombre, slug, tipo_tag, administrado_por_admin, activo)
values
  -- ── Industrias / rubros ──
  ('Metalmecánica', 'metalmecanica', 'industria', true, true),
  ('Fundición', 'fundicion', 'industria', true, true),
  ('Forja', 'forja', 'industria', true, true),
  ('Industria del caucho', 'industria-del-caucho', 'industria', true, true),
  ('Pinturas y tintas', 'pinturas-y-tintas', 'industria', true, true),
  ('Gráfica e impresión', 'grafica-e-impresion', 'industria', true, true),
  ('Maquinaria industrial', 'maquinaria-industrial', 'industria', true, true),
  ('Refrigeración y climatización', 'refrigeracion-y-climatizacion', 'industria', true, true),
  ('Gases industriales', 'gases-industriales', 'industria', true, true),
  ('Biotecnología', 'biotecnologia', 'industria', true, true),
  ('Cosmética', 'cosmetica', 'industria', true, true),
  ('Indumentaria', 'indumentaria', 'industria', true, true),
  ('Calzado y cuero', 'calzado-y-cuero', 'industria', true, true),
  ('Madera y muebles', 'madera-y-muebles', 'industria', true, true),
  ('Cerámica', 'ceramica', 'industria', true, true),
  ('Industria del vidrio', 'industria-del-vidrio', 'industria', true, true),
  ('Reciclaje y gestión de residuos', 'reciclaje-y-gestion-de-residuos', 'industria', true, true),
  ('Electricidad y tableros', 'electricidad-y-tableros', 'industria', true, true),
  ('Agua y efluentes', 'agua-y-efluentes', 'industria', true, true),
  ('Energías renovables', 'energias-renovables', 'industria', true, true),
  ('Telecomunicaciones', 'telecomunicaciones', 'industria', true, true),
  ('Bebidas', 'bebidas', 'industria', true, true),
  ('Agropecuario', 'agropecuario', 'industria', true, true),
  ('Seguridad e higiene', 'seguridad-e-higiene', 'industria', true, true),
  -- ── Materiales ──
  ('Chapa de acero', 'chapa-de-acero', 'material', true, true),
  ('Hierro', 'hierro', 'material', true, true),
  ('Zinc', 'zinc', 'material', true, true),
  ('Estaño', 'estano', 'material', true, true),
  ('Poliéster', 'poliester', 'material', true, true),
  ('Resina epoxi', 'resina-epoxi', 'material', true, true),
  ('Poliuretano', 'poliuretano', 'material', true, true),
  ('Cartón', 'carton', 'material', true, true),
  ('Papel', 'papel', 'material', true, true),
  ('Cuero', 'cuero', 'material', true, true),
  ('Tela', 'tela', 'material', true, true),
  ('Acrílico', 'acrilico', 'material', true, true),
  ('ABS', 'abs', 'material', true, true),
  ('PET', 'pet', 'material', true, true),
  ('MDF', 'mdf', 'material', true, true),
  ('Cemento', 'cemento', 'material', true, true),
  -- ── Capacidades / servicios ──
  ('Inyección de plásticos', 'inyeccion-de-plasticos', 'capacidad', true, true),
  ('Extrusión', 'extrusion', 'capacidad', true, true),
  ('Termoformado', 'termoformado', 'capacidad', true, true),
  ('Soplado de plásticos', 'soplado-de-plasticos', 'capacidad', true, true),
  ('Serigrafía', 'serigrafia', 'capacidad', true, true),
  ('Impresión 3D', 'impresion-3d', 'capacidad', true, true),
  ('Impresión offset', 'impresion-offset', 'capacidad', true, true),
  ('Carpintería', 'carpinteria', 'capacidad', true, true),
  ('Tapizado', 'tapizado', 'capacidad', true, true),
  ('Fumigación y control de plagas', 'fumigacion-y-control-de-plagas', 'capacidad', true, true),
  ('Limpieza industrial', 'limpieza-industrial', 'capacidad', true, true),
  ('Gestión de residuos', 'gestion-de-residuos', 'capacidad', true, true),
  ('Matricería', 'matriceria', 'capacidad', true, true),
  ('Doblado de caños', 'doblado-de-canos', 'capacidad', true, true),
  -- ── Necesidad que resuelvo ──
  ('Provisión de materiales', 'provision-de-materiales', 'problema', true, true),
  ('Alquiler de equipos', 'alquiler-de-equipos', 'problema', true, true),
  ('Servicio tercerizado', 'servicio-tercerizado', 'problema', true, true),
  ('Homologación', 'homologacion', 'problema', true, true)
on conflict do nothing;
