-- =============================================================================
-- Migración: Seed de socios UIAB desde padrón oficial (Info Socios VAXLER.xlsx)
-- Fecha: 2026-04-12
--
-- 1. Crea tabla tarifas y la puebla
-- 2. Agrega columnas faltantes a empresas (tarifa FK, n_socio, codigo_postal,
--    actividad, referente, email_referente)
-- 3. Crea categorías basadas en los rubros del padrón
-- 4. Inserta las 51 empresas socias con estado 'aprobada'
-- 5. Vincula empresas con categorías en empresas_categorias
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Crear tabla tarifas
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tarifas (
  nivel        smallint PRIMARY KEY CHECK (nivel IN (1, 2, 3)),
  nombre       text NOT NULL,
  precio_anual integer NOT NULL,
  descripcion  text,
  actualizado_en timestamptz DEFAULT now()
);

COMMENT ON TABLE tarifas IS 'Niveles de membresía UIAB. Los precios los actualiza el administrador.';
COMMENT ON COLUMN tarifas.precio_anual IS 'Precio anual en pesos argentinos.';

INSERT INTO tarifas (nivel, nombre, precio_anual, descripcion) VALUES
  (1, 'Tarifa 1', 108000, 'Empresas pequeñas y prestadores de servicios'),
  (2, 'Tarifa 2', 216000, 'Empresas medianas con actividad industrial'),
  (3, 'Tarifa 3', 360000, 'Grandes industrias y manufactureras establecidas')
ON CONFLICT (nivel) DO UPDATE SET
  precio_anual   = EXCLUDED.precio_anual,
  descripcion    = EXCLUDED.descripcion,
  actualizado_en = now();

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Agregar columnas faltantes a la tabla empresas
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS tarifa smallint REFERENCES tarifas(nivel);

COMMENT ON COLUMN empresas.tarifa IS 'Nivel de tarifa de membresía UIAB. FK a tabla tarifas.';

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS n_socio text;

COMMENT ON COLUMN empresas.n_socio IS
  'Número de socio UIAB asignado al inscribirse en la unión industrial.';

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS codigo_postal integer;

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS actividad text;

COMMENT ON COLUMN empresas.actividad IS
  'Actividad principal de la empresa según el padrón UIAB.';

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS referente text;

COMMENT ON COLUMN empresas.referente IS
  'Nombre del referente / persona de contacto de la empresa.';

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS email_referente text;

COMMENT ON COLUMN empresas.email_referente IS
  'Email del referente / persona de contacto.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Agregar constraints únicas necesarias para los ON CONFLICT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_slug
  ON categorias (slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_cuit
  ON empresas (cuit);

CREATE UNIQUE INDEX IF NOT EXISTS idx_empresas_categorias_unique
  ON empresas_categorias (empresa_id, categoria_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Crear categorías basadas en los rubros del padrón
-- Solo se insertan si no existen (por slug).
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO categorias (id, nombre, slug, descripcion, activa, creado_en)
VALUES
  (gen_random_uuid(), 'Metalúrgica',      'metalurgica',      'Fundición, forja, fabricación de productos metálicos',           true, now()),
  (gen_random_uuid(), 'Alimentos',        'alimentos',        'Elaboración y envasado de alimentos y bebidas',                  true, now()),
  (gen_random_uuid(), 'Química',          'quimica',          'Productos químicos, resinas, polímeros',                         true, now()),
  (gen_random_uuid(), 'Construcción',     'construccion',     'Materiales, módulos, cerámicas y servicios para construcción',    true, now()),
  (gen_random_uuid(), 'Poliéster',        'poliester',        'Impresión y fabricación sobre envases de poliéster',              true, now()),
  (gen_random_uuid(), 'Seguridad',        'seguridad',        'Sistemas de seguridad y elementos de protección industrial',     true, now()),
  (gen_random_uuid(), 'Autopartista',     'autopartista',     'Fabricación de autopartes y componentes vehiculares',             true, now()),
  (gen_random_uuid(), 'Electricidad',     'electricidad',     'Productos y tableros eléctricos industriales',                    true, now()),
  (gen_random_uuid(), 'Pinturerías',      'pinturerias',      'Fabricación de pinturas, barnices y recubrimientos',              true, now()),
  (gen_random_uuid(), 'Biotecnología',    'biotecnologia',    'Materias primas agrícolas y biotecnología',                      true, now()),
  (gen_random_uuid(), 'Carpas',           'carpas',           'Alquiler y fabricación de carpas para eventos',                   true, now()),
  (gen_random_uuid(), 'Gráfica',          'grafica',          'Diseño y fabricación de estuches, etiquetas y envases gráficos',  true, now()),
  (gen_random_uuid(), 'Mayorista',        'mayorista',        'Distribución mayorista de productos',                             true, now()),
  (gen_random_uuid(), 'Embalajes',        'embalajes',        'Embalajes industriales',                                          true, now()),
  (gen_random_uuid(), 'Papelera',         'papelera',         'Conversión e impresión de papeles',                                true, now()),
  (gen_random_uuid(), 'Plásticos',        'plasticos',        'Envases plásticos y recubrimientos',                               true, now()),
  (gen_random_uuid(), 'Maquinarias',      'maquinarias',      'Componentes mecánicos y equipos de elevación',                     true, now()),
  (gen_random_uuid(), 'Textil',           'textil',           'Industria textil',                                                  true, now()),
  (gen_random_uuid(), 'Informática',      'informatica',      'Servicios de informática y sistemas de codificación',              true, now()),
  (gen_random_uuid(), 'Transporte',       'transporte',       'Transporte automotor de cargas',                                   true, now()),
  (gen_random_uuid(), 'Mantenimiento',    'mantenimiento',    'Sistemas de aire acondicionado y mantenimiento industrial',        true, now()),
  (gen_random_uuid(), 'Reparación de Automóviles', 'rep-automoviles', 'Equipos volcadores y maquinaria para vehículos',          true, now())
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: Insertar empresas socias del padrón UIAB
-- Se usa ON CONFLICT (cuit) para no duplicar si ya existen.
-- Estado = 'aprobada', aprobada_en = now().
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO empresas (id, razon_social, cuit, n_socio, direccion, localidad, provincia, pais, codigo_postal, actividad, email, sitio_web, referente, email_referente, tarifa, estado, aprobada_en, creado_en)
VALUES
  (gen_random_uuid(), 'ACEROS ANGELETTI S.A.',                   '30-50188721-4', '0074', 'AV. HIPOLITO YRIGOYEN 16102',                          'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FUNDICION DE HIERRO',                                                          'ventas@acerosangeletti.com.ar',       'https://acerosangeletti.com.ar/',                   'Victoria Angeletti',           'direccion@acerosangeletti.com.ar',            3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ALIMENTOS FRANSRO',                       '30-70957893-2', '0076', 'JOSE INGENIEROS S/N',                                  'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ELABORACION DE PASTAS',                                                        'alimentosfransro@yahoo.com.ar',       'https://www.alimentosfransro.com.ar/',              'Silvina Cerenique',            'silvi.cerenique@gmail.com',                   2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'AKUA S.A',                                '30-70756739-9', '0003', 'URUGUAR 1117',                                         'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ELABORACIÓN Y ENVASADO DE AGUA EN BOTELLONES',                                 'agua@freezy.com.ar',                  'https://www.freezy.com.ar/',                        'Juan Rodriguez',               'juan@freezy.com.ar',                          1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ALKANOS S.A.',                            '30-55868648-7', '0065', 'A.D. BARBIERI 2273',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'QUIMICA',                                                                      'administracion@alkanos.com.ar',       'https://www.alkanos.com.ar/',                       'Monica Bustelo',               'mbbustelo@alkanos.com.ar',                    1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ANDARIEGA SOLUCIONES HABITACIONALES S.R.L','30-60114367-0', '0048', 'BAHÍA BLANCA 2331/ FERNANDEZ MORENO 2331 / 3030',     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'MÓDULOS TRANSPORTABLES P. OBRADORES',                                          'info@andariega.com.ar',               'https://www.andariega.com.ar/',                     'Hernan Pereyra',               'hernan.pereyra@andariega.com.ar',             3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'A. D. BARBIERI S.A.',                     '30-63920123-2', '0001', 'A.D. BARBIERI 1382',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'CONSTRUCCION, CORTINAS PLASTICAS - PERFILES, ETC',                             'feproveedores@adbarbieri.com.ar',     'https://www.adbarbieri.com/',                       'Julio Barbieri',               'julio@adbarbieri.com.ar',                     3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ARCURI S.A.',                             '33-70988071-9', '0078', 'JOSE INGENIEROS 2665',                                 'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'MAYORISTA DE PRODUCTOS VETERINARIOS',                                          'info@arcurisa.com.ar',                'https://arcurisa.com.ar/',                          'Nahuel Bechara',               'info@arcurisa.com.ar',                        1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'BAYRESPLASTIC S.R.L.',                    '30-70934716-7', '0005', 'B. FERNANDEZ MORENO 2982',                             'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'IMPRESIONES S/ BOLSAS POLIESTER',                                              'bayresplastic@bayresplastic.com.ar',  'https://bayresplastic.com.ar/',                     'Luis Cura',                    'luiscura@bayresplastic.com.ar',               1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'BESTCHEM S.A.',                           '30-61186024-9', '0073', 'CAFFERATA SUR 3087',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICA DE SELLADORES DE VIDRIO Y ALUMINIO',                                   'info@bestchem.com.ar',                'https://bestchem.com.ar/',                          'SEBASTIAN BESTEIRO',           'sebastianb@bestchem.com.ar',                  2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'BECKERS ARGENTINA S.A.',                  '30-71456419-2', '0072', 'A.D. BARBIERI S/N',                                    'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICA DE PINTURAS Y BARNICES',                                               'beckers-proveedores@bpo-solver.com',  'https://www.beckers-group.com/',                    'Alberto Daniel Garcia',        'Alberto.garcia@beckers-group.com',            1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'BIOBEST ARGENTINA S.A.',                  '30-71207473-2', '0007', 'BUENOS AIRES 2170',                                    'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'VENTA AL POR MAYOR DE MATERIAS PRIMAS AGRÍCOLAS Y DE LA SILVICULTURA',         'info@brometan.com.ar',                'https://www.biobest.com/es',                        'Luis Carbelotto',              'lflopezcaberlotto@brometan.com.ar',           1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'BOLSAPEL S.A.I.C.I.F.Y.A',               '30-50017502-4', '0008', 'TOMAS GUIDO 2500',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'IMPRESIONES S/ ENVASES POLIESTER',                                             'info@bolsapel.com',                   'https://www.bolsapel.com.ar/',                      'Martin Zorzoli',               'mzorzoli@bolsapel.com',                       3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'CARPAS D` ANGIOLA',                       '30-57634432-1', '0010', 'JUAN XXIII 2980',                                      'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ALQUILER Y FABRICACION DE CARPAS PARA EVENTOS',                                'proveedores@carpasdangiola.com',      'https://carpasdangiola.com/',                       'Adrian Apuzzo',                'apuzzo@carpasdangiola.com',                   2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'CENTRAL ALERT',                           '30-71024784-2', '0056', 'A D BARBIERI 1929',                                    'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'SISTEMAS DE SEGURIDAD',                                                        'info@alert.com.ar',                   'https://www.alert.com.ar/home',                     'Pablo',                        'pablo@alert.com.ar',                          1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'IND. CERAMICAS LOURDES S.A.',             '30-64440679-9', '0058', 'RUTA PROVINCIAL N°16 S/N',                             'LONGCHAMPS',  'Buenos Aires', 'Argentina', 1852, 'FABRICA DE CERAMICAS',                                                         'info@ceramicas-lourdes.com.ar',       'https://www.ceramicas-lourdes.com.ar/',             'Leonardo Gallo',               'leonardo.gallo@ceramicas-lourdes.com.ar',     3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'DIRANSA SRL',                             '30-60548162-7', '0011', 'PRESIDENTE ORTIZ 2485',                                'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PRODUCTOS QUÍMICOS',                                                           'diransa@diransa.com.ar',              'https://www.diransa.com.ar/',                       'Ariel Vinagre',                'avinagre@diransa.com.ar',                     3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'FINE & PURE S.R.L.',                      '30-70943894-4', '0013', 'INTENDENTE PINTOS 2462',                               'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PRODUCTOS QUÍMICOS PARA INDUSTRIA ALIMENTICIA',                                'info@fineandpure.com.ar',             'https://fineandpure.com.ar/',                       'Francisco Quevedo',            'quevedof@fineandpure.com.ar',                 1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'TDMA SRL',                                '30-71409428-5', '0055', 'JOSE MELIAN 2820',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICACION DE MALLAS METÁLICAS Y SUS DERIVADOS',                              'proveedores@ferromallas.com.ar',      'https://ferromallas.com.ar/',                       'Nicolas Azzollini',            'n.azzollini@ferromallas.com.ar',               2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'FORJA ATLAS S.A.',                        '30-55966540-8', '0014', 'TOMAS GUIDO 2497',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FORJADO - FUNDICIÓN Y TRATAMIENTOS TÉRMICOS',                                  'administracion@forja-atlas.com.ar',   NULL,                                                'Maria Eugenia Bavcar',         'administracion@forja-atlas.com.ar',           1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'GENROD S.A.',                             '30-67854721-9', '0015', 'A.D. BARBIERI 1635',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PRODUCTOS ELÉCTRICOS',                                                         'administracion@genrod.com.ar',        'https://genrod.com.ar/home',                        'Miguel Rodriguez',             'marodriguez@genrod.com.ar',                   3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'GINZUK S.R.L.',                           '30-71287400-3', '0054', 'JUAN XXIII 3180',                                      'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'EMBALAJES INDUSTRIALES',                                                       'leandro@embalajesginzuk.com.ar',      'https://www.embalajesginzuk.com.ar/',               'Leandro Ginzuk',               'leandro@embalajesginzuk.com.ar',              1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'TGI PACK SA',                             '30-71076948-2', '0049', 'FONROUGE 3197',                                        'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'DISEÑO Y FABRICACIÓN DE ESTUCHES EN CARTULINA Y MICROCORRUGADO',               'info@tgipack.com.ar',                 'https://tgipack.com.ar/',                           'Silvio Nobarvos',              'silvio.nobarvos@graficatgi.com.ar',           1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'INDIOQUIMICA S.A',                        '30-52214352-5', '0018', 'GUATAMBU 1780',                                        'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PRODUCTOS QUÍMICOS',                                                           'compras@indioquimica.com',            'https://indioquimica.com.ar/',                      'Mariano Castro',               'mjlcastro@indioquimica.com.ar',               1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'INDUSTRIAS BACO SAIC',                    '30-50306936-5', '0046', 'AVENIDA MONTEVERDE 3645',                              'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICACIÓN DE EQUIPOS VOLCADORES PARA LOS SECTORES DE CONSTRUCCIÓN Y MINERÍA','info@industriasbaco.com',              'https://industriasbaco.com/',                       'Matías Bacolla',               'mbacolla@industriasbaco.com',                 2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'INDUSTRIAS GUIDI S.A.',                   '33-52537286-9', '0019', 'AV. HIPOLITO YRIGOYEN 16299',                          'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FÁBRICA DE AUTOPARTES',                                                        'tesoreria@industriasguidi.com.ar',    'https://industriasguidi.com.ar/',                   'Carolina Castro',              'castro.carolina@gmail.com',                   3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'JACQUARD TEXTILE SOUTH AMERICA',          '30-70989820-1', '0068', 'TOMAS GUIDO 2468',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'TEXTIL',                                                                       'administracion@jacquard-textile.com.ar','https://www.jacquard-textile.com/',                'Fernando Ariel Perasso',       'administracion@jacquard-textile.com.ar',      1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'JUNAR S.A.',                              '30-65345560-3', '0021', 'JOSE INGENIEROS 2215',                                 'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'JUNTAS PARA MOTORES',                                                          'ventas@juntasmeyro.com.ar',           'https://www.juntasmeyro.com.ar/#/home',             'Pedro Martin',                 'pmartin@juntasmeyro.com.ar',                  2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'KORUND S.A.',                             '30-70864148-7', '0077', 'GRAL MADARIAGA 1550',                                  'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICA DE ABRASIVOS',                                                         'korund@korund.com.ar',                'https://www.korund.com.ar/sitio/',                  'Claudia Escobar',              'cescobar@korund.com.ar',                      1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'LABELTEC S.A.',                           '30-70924956-4', '0060', 'FLORIDA 1790',                                         'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICA DE ETIQUETAS Y RÓTULOS, CON Y SIN ADHESIVOS',                          'javierdls@labeltec.com.ar',           'http://labeltec.com.ar/',                           'Gustavo McCarthy',             'gmccarthy@labeltec.com.ar',                   1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'LATIN CHEMICAL SUPPLIERS S.A.',           '30-70861829-9', '0023', 'TOMAS GUIDO 2245',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'QUÍMICA, ALMACENAMIENTO Y DISTRIBUCIÓN',                                       'info@latinchemical.com.ar',           NULL,                                                'Martin Fonticelli',            'mfonticelli@latinchemical.com.ar',            2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'METALURGICA LONGCHAMPS',                  '30-71232689-8', '0079', 'AV. HIPOLITO YRIGOYEN 17551',                          'LONGCHAMPS',  'Buenos Aires', 'Argentina', 1854, 'FABRICACIÓN DE PRODUCTOS ELABORADOS DE METAL',                                 'info@metlongchamps.com',              'https://metlongchamps.com/',                        'Lucas Santa Cruz',             'lsantacruz@metlongchamps.com',                1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'MIGUEL ABAD S.A.',                        '30-50297474-9', '0027', 'TIMBO 2880',                                           'LONGCHAMPS',  'Buenos Aires', 'Argentina', 1852, 'FABRICA DE COMPONENTES MECÁNICOS PARA EQUIPOS DE ELEVACIÓN Y TRASLACIÓN DE MATERIALES','abad@miguelabad.com.ar',        'https://miguelabad.com.ar/',                        'Hugo Abad',                    'habad@miguelabad.com.ar',                     2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'NAVES DEL SUR SA',                        '33-70979631-9', '0075', 'CAFFERATA 3294',                                       'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICACION DE BOMBAS A TORNILLO',                                             'seguridad@navesdelsur.com',           'https://www.navesdelsur.com/',                      'Laura Pagola',                 'calidad@navesdelsur.com',                     1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ORMAZABAL',                               '30-69901647-7', '0070', 'JOSE MELIAN 3223',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ACCESORIOS PARA PLOMERIA, ELECTRICIDAD Y GAS',                                 'oar@ormazabal.com',                   'https://www.ormazabal.com/',                        'Omar Romero',                  'oro@ormazabal.com',                           1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'PLAQUIMET S.A.',                          '30-70979643-3', '0028', 'CABO 1° MORENO 1645',                                  'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'QUIMICA- RESINAS',                                                             'ventas@plaquimet.com',                'https://www.plaquimet.com/',                        'Daniel Laino',                 'dlaino@plaquimet.com',                        2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'POLIGSA S.A.',                            '30-70836724-5', '0031', 'A.D. BARBIERI 2940',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ENVASES PLÁSTICOS',                                                            'ventas@poligsa.com.ar',               'https://poligsa.com.ar/',                           'Roxana Rodriguez',             'rodriguezr@poligsa.com.ar',                   1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'PROLAS S.A.',                             '30-70813368-6', '0066', 'FLORIDA 1760',                                         'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICACION DE TINTAS Y DILUYENTES',                                           'diego@prolas.com.ar',                 'https://www.prolas.com.ar/',                        'Sergio Las Heras',             'prolas@prolas.com.ar',                        1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'PULVERLUX',                               '33-70741536-9', '0050', 'JOSE MELIAN 2983',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PINTURAS EN POLVO',                                                            'ventas@pulverlux.com.ar',             NULL,                                                'AGUSTIN DUARTE',               'agustinduarte@pulverlux.com.ar',              2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'RPA CATAFORESIS FACTORY S.R.L.',          '30-71274930-6', '0034', 'JOSE MELIAN 3226',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'RECUBRIMIENTO DE PLASTICOS Y DECO',                                            'info@rpacataforesisfactory.com',      'https://rpacataforesisfactory.com/',                'Karina',                       'administracion@rpacataforesisfactory.com',    1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ROGUANT S.R.L.',                          '30-63631621-7', '0057', 'CABO 1° MORENO 2240',                                  'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ELEM. DE PROTECCIÓN PARA LA INDUSTRIA',                                        'roguant@roguant.com.ar',              'https://www.roguant.com.ar/',                       'Debora Rebori',                'drebori@roguant.com.ar',                      2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ROLL PAPER S.R.L.',                       '30-70769443-9', '0040', 'JOSE MELIAN 2260',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'CONVERSION E IMPRESIÓN DE PAPELES',                                            'rollpaper@rollpaper.com.ar',          'https://www.rollpaper.com.ar/',                     'Ulises De Carlo',              'udecarlo@rollpaper.com.ar',                   2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'SAINT GOBAIN S.A. - MEGAFLEX',            '30-50052907-1', '0025', 'A.D. BARBIERI 1760',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FABRICACION DE MEMBRANAS ASFALTICAS',                                          'cinthia.smaldone@saint-gobain.com',   'https://www.megaflex.ar/es',                        'Macarena Ramirez',             'macarena.ramirez@saint-gobain.com',           3, 'aprobada', now(), now()),
  (gen_random_uuid(), 'SEFINPOL S.A.',                           '30-71119543-9', '0035', 'GRAL MADARIAGA 1364',                                  'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'QUIMICA-POLIMEROS',                                                            'info@sefinpol.com',                   'https://www.sefinpol.com/',                         'Sergio Alonso',                's.alonso@sefinpol.com',                       2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'SERVICIOS DEL PARQUE ALTE. BROWN S.R.L',  '30-71230758-3', '0004', 'CUYO 2314',                                            'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'ALQUILER, MONTAJE Y DESMANTELAMIENTO DE ANDAMIOS Y ESTRUCTURAS TUBULARES',     NULL,                                  NULL,                                                'Ruben Pagella',                'rfpagella@yahoo.com.ar',                      1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'SISTEMAS DE CODIFICACION S.A',            '30-70797262-5', '0036', 'A.D. BARBIERI 1980',                                   'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'SISTEMAS DE CODIFICACIÓN DE BARRAS',                                           'info@siscod.com.ar',                  'https://siscod.ar/',                                'Horacio Etchart',              'hetchart@siscod.com.ar',                      2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'TODO ADROGUE',                            '30-71485071-3', '0052', 'INTENDETE DR. M. GONZÁLEZ 1185',                       'ADROGUE',     'Buenos Aires', 'Argentina', 1846, 'SERVICIOS DE INFORMÁTICA',                                                     'info@grupotodo.com.ar',               'https://www.grupotodo.com.ar/',                     'Nicolas Reggiani',             'nicolas@grupotodo.com.ar',                    1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'TRANSPORTES MORETTA',                     '30-71022068-5', '0071', 'JOSÉ MELIAN 3064',                                     'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'TRANSPORTE AUTOMOTOR DE CARGAS',                                               'info@transportemoretta.com.ar',       'https://transportemoretta.com.ar/',                 'Pablo Moretta',                'pmoretta@transportemoretta.com.ar',           1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'TROX ARGENTINA S.A.',                     '30-70820788-4', '0061', 'TIMBO 2610',                                           'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'SISTEMAS INTEGRALES DE AIRE ACONDICIONADO',                                    'matias.tolace@troxgroup.com',         'https://www.trox.com.ar/',                          'Carlos Brischetto',            'carlos.brischetto@troxgroup.com',             2, 'aprobada', now(), now()),
  (gen_random_uuid(), 'VELARGEN S.R.L.',                         '30-63300013-8', '0047', 'AGRIPINA D´ANTONIO 2377',                              'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'PRODUCTOS QUIMICOS INDUSTRIALES',                                              'info@velargen.com.ar',                'https://velargen.com.ar/',                          'Carla Argento',                'velargen@velargen.com.ar',                    1, 'aprobada', now(), now()),
  (gen_random_uuid(), 'ZOLODA S.A.',                             '30-54891771-5', '0062', 'AV. HIPOLITO YRIGOYEN 15689',                          'BURZACO',     'Buenos Aires', 'Argentina', 1852, 'FÁBRICA DE ARTEFACTOS Y TABLEROS ELECTRICOS INDUSTRIALES',                     'gfernandez@zoloda.com.ar',            'https://www.zoloda.com.ar/',                        'Jorge Negri',                  'jnegri@zoloda.com.ar',                        3, 'aprobada', now(), now())
ON CONFLICT (cuit) DO UPDATE SET
  n_socio         = EXCLUDED.n_socio,
  direccion       = EXCLUDED.direccion,
  localidad       = EXCLUDED.localidad,
  provincia       = EXCLUDED.provincia,
  pais            = EXCLUDED.pais,
  codigo_postal   = EXCLUDED.codigo_postal,
  actividad       = EXCLUDED.actividad,
  email           = EXCLUDED.email,
  sitio_web       = EXCLUDED.sitio_web,
  referente       = EXCLUDED.referente,
  email_referente = EXCLUDED.email_referente,
  tarifa          = EXCLUDED.tarifa,
  estado          = EXCLUDED.estado,
  aprobada_en     = EXCLUDED.aprobada_en;


-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: Vincular empresas con categorías (empresas_categorias)
-- Mapeamos el rubro del padrón al slug de la categoría.
-- ─────────────────────────────────────────────────────────────────────────────

-- Metalúrgica
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'metalurgica'
  AND e.cuit IN ('30-50188721-4', '30-61186024-9', '30-55966540-8', '33-70979631-9', '30-71232689-8')
ON CONFLICT DO NOTHING;

-- Alimentos
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'alimentos'
  AND e.cuit IN ('30-70957893-2', '30-70756739-9')
ON CONFLICT DO NOTHING;

-- Química
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'quimica'
  AND e.cuit IN ('30-55868648-7', '30-60548162-7', '30-70943894-4', '30-52214352-5', '30-70861829-9', '30-70979643-3', '30-71119543-9', '30-63300013-8')
ON CONFLICT DO NOTHING;

-- Construcción
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'construccion'
  AND e.cuit IN ('30-60114367-0', '30-63920123-2', '30-64440679-9', '30-71409428-5', '30-69901647-7', '30-50052907-1', '30-71230758-3')
ON CONFLICT DO NOTHING;

-- Poliéster
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'poliester'
  AND e.cuit IN ('30-70934716-7', '30-50017502-4')
ON CONFLICT DO NOTHING;

-- Seguridad
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'seguridad'
  AND e.cuit IN ('30-71024784-2', '30-63631621-7')
ON CONFLICT DO NOTHING;

-- Autopartista
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'autopartista'
  AND e.cuit IN ('33-52537286-9', '30-65345560-3')
ON CONFLICT DO NOTHING;

-- Electricidad
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'electricidad'
  AND e.cuit IN ('30-67854721-9', '30-54891771-5')
ON CONFLICT DO NOTHING;

-- Pinturerías
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'pinturerias'
  AND e.cuit IN ('30-71456419-2', '30-70813368-6', '33-70741536-9')
ON CONFLICT DO NOTHING;

-- Biotecnología
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'biotecnologia'
  AND e.cuit IN ('30-71207473-2')
ON CONFLICT DO NOTHING;

-- Carpas
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'carpas'
  AND e.cuit IN ('30-57634432-1')
ON CONFLICT DO NOTHING;

-- Gráfica
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'grafica'
  AND e.cuit IN ('30-71076948-2', '30-70924956-4')
ON CONFLICT DO NOTHING;

-- Mayorista
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'mayorista'
  AND e.cuit IN ('33-70988071-9')
ON CONFLICT DO NOTHING;

-- Embalajes
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'embalajes'
  AND e.cuit IN ('30-71287400-3')
ON CONFLICT DO NOTHING;

-- Papelera
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'papelera'
  AND e.cuit IN ('30-70769443-9')
ON CONFLICT DO NOTHING;

-- Plásticos
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'plasticos'
  AND e.cuit IN ('30-70836724-5', '30-71274930-6')
ON CONFLICT DO NOTHING;

-- Maquinarias
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'maquinarias'
  AND e.cuit IN ('30-50297474-9')
ON CONFLICT DO NOTHING;

-- Textil
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'textil'
  AND e.cuit IN ('30-70989820-1')
ON CONFLICT DO NOTHING;

-- Informática
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'informatica'
  AND e.cuit IN ('30-70797262-5', '30-71485071-3')
ON CONFLICT DO NOTHING;

-- Transporte
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'transporte'
  AND e.cuit IN ('30-71022068-5')
ON CONFLICT DO NOTHING;

-- Mantenimiento
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'mantenimiento'
  AND e.cuit IN ('30-70820788-4')
ON CONFLICT DO NOTHING;

-- Reparación de Automóviles
INSERT INTO empresas_categorias (id, empresa_id, categoria_id)
SELECT gen_random_uuid(), e.id, c.id
FROM empresas e, categorias c
WHERE c.slug = 'rep-automoviles'
  AND e.cuit IN ('30-50306936-5')
ON CONFLICT DO NOTHING;

-- Korund (sin rubro en el padrón — no se vincula a categoría)
-- CUIT: 30-70864148-7
