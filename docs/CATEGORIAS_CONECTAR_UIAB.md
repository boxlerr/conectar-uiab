# Taxonomía de Categorías — UIAB Conecta
**Versión:** 1.0 | **Fecha:** 02-04-2026 | **Equipo:** Vaxler Software

> **Lógica de diseño:**
> - **2 niveles:** Rubro Principal (padre) → Especialidad (hijo). Sin tercer nivel para mantener la UX simple.
> - **Aplica a:** Empresas del Parque + Proveedores de Servicios externos.
> - **Documentación:** Se divide en "Documentación Base" (toda entidad) + "Documentación Específica" (por rubro).
> - **Aliases:** Se listan para alimentar la tabla `alias_categorias` y mejorar el buscador.

---

## 📋 DOCUMENTACIÓN BASE — Toda empresa/proveedor debe presentar

| # | Documento | Descripción | Obligatorio |
|---|-----------|-------------|:-----------:|
| D-00 | CUIT activo en AFIP | Constancia de inscripción vigente | ✅ |
| D-01 | Constancia de Inscripción AFIP | Condición frente al IVA (RI, Monotributo, Exento) | ✅ |
| D-02 | Habilitación municipal | Habilitación del establecimiento/actividad en el municipio | ✅ |
| D-03 | Seguro de Responsabilidad Civil | Póliza vigente con cobertura mínima definida por UIAB | ✅ |
| D-04 | Estatuto o contrato social | Para S.A., S.R.L., S.A.S. (con última modificación) | ✅ (personas jurídicas) |
| D-05 | DNI del representante legal | Para personas físicas / apoderados | ✅ |
| D-06 | Poder notarial | Si quien firma no es el titular | Condicional |
| D-07 | Certificado de domicilio | Recibo de servicio o constancia municipal | ✅ |

---

## 🏭 SECTOR 01 — METALMECÁNICA Y METALURGIA

**Descripción:** Empresas que trabajan metales mediante procesos de transformación, fabricación, mecanizado o tratamiento superficial.
**Slug padre:** `metalmecanica-metalurgia`
**Aliases padre:** metalurgia, metal, acero, hierro, chapa, soldadura, fundición

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `torneria-mecanizado` | Tornería y Mecanizado CNC | torno, fresado, cnc, mecanizado, rectificado, mandrinado |
| `soldadura-construcciones-metalicas` | Soldadura y Construcciones Metálicas | soldador, mig, tig, arco, estructura metálica, herrería industrial |
| `fundicion-forja` | Fundición y Forja | fundición, vaciado, forja, colada, moldes |
| `tratamientos-termicos-superficiales` | Tratamientos Térmicos y Superficiales | galvanizado, cromado, niquelado, pintura electrostática, sandblasting, granallado, temple, revenido |
| `chapa-y-perfiles` | Chapa, Perfiles y Corte | corte laser, plasma, oxicorte, doblez, plegado, cizalla, perfiles |
| `matriceria-estampado` | Matricería y Estampado | matrices, troqueles, estampado, punzonado |
| `fabricacion-estructuras` | Fabricación de Estructuras | galpones, vigas, columnas, mezzanines, pasarelas |
| `fabricacion-recipientes-presion` | Recipientes y Tuberías a Presión | tanques, autoclaves, intercambiadores, cañerías industriales |
| `muelles-resortes` | Muelles y Resortes | resortes, muelles, amortiguadores mecánicos |
| `herreria-forja-artesanal` | Herrería y Cerrajería Industrial | puertas industriales, portones, rejas, cerrajería |

### Documentación específica requerida

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-M01 | Certificación ISO 9001 (si posee) | Todas las sub |
| D-M02 | Habilitación de calderas y recipientes a presión (SRT) | `fabricacion-recipientes-presion` |
| D-M03 | Certificado de aptitud de soldadores (IRAM/AWS/API) | `soldadura-construcciones-metalicas`, `fabricacion-recipientes-presion` |
| D-M04 | Constancia de inscripción en Registro de Fundidores (si aplica provincial) | `fundicion-forja` |
| D-M05 | ART con nómina de empleados | Todas las sub |

---

## 🧪 SECTOR 02 — QUÍMICA Y PETROQUÍMICA

**Descripción:** Producción, transformación y comercialización de productos químicos, plásticos base y derivados del petróleo.
**Slug padre:** `quimica-petroquimica`
**Aliases padre:** química, petroquímica, reactivos, solventes, resinas, lubricantes, pinturas

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `fabricacion-productos-quimicos` | Fabricación de Productos Químicos | reactivos, ácidos, álcalis, solventes industriales |
| `pinturas-recubrimientos` | Pinturas y Recubrimientos Industriales | pinturas, barnices, esmaltes, recubrimientos epóxicos |
| `lubricantes-aceites` | Lubricantes y Aceites Industriales | lubricantes, aceites de corte, grasas, fluidos hidráulicos |
| `adhesivos-selladores` | Adhesivos y Selladores | pegamentos industriales, silicona, epoxi, selladores |
| `productos-limpieza-industrial` | Productos de Limpieza Industrial | desengrasantes, detergentes industriales, desincrustantes |
| `gases-industriales` | Gases Industriales | oxígeno, argón, nitrógeno, CO2, acetileno, mezclas |
| `plasticos-base` | Plásticos y Polímeros (materia prima) | polietileno, polipropileno, PVC, ABS, nylon |
| `quimica-agricola` | Agroquímicos | fertilizantes, herbicidas, fungicidas, plaguicidas |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-Q01 | Habilitación APRA / Organismo Ambiental Provincial | Todas |
| D-Q02 | Registro de Productos ante SENASA (agroquímicos) | `quimica-agricola` |
| D-Q03 | Habilitación ANMAT (si aplica) | `productos-limpieza-industrial` con uso alimentario |
| D-Q04 | Plan de Gestión de Residuos Peligrosos (OPDS/ACUMAR) | Todas las que generen efluentes |
| D-Q05 | Hoja de Seguridad de Materiales (MSDS/SDS) de productos | Todas |
| D-Q06 | Seguro ambiental (Ley 25.675) | Todas |

---

## 🍎 SECTOR 03 — ALIMENTARIA Y AGROINDUSTRIA

**Descripción:** Procesamiento, elaboración, envasado y distribución de alimentos y bebidas.
**Slug padre:** `alimentaria-agroindustria`
**Aliases padre:** alimentos, comida, bebidas, agroalimentos, frigorífico, molinería, lácteos

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `procesamiento-carnes` | Frigoríficos y Procesamiento de Carnes | frigorífico, carnes, chacinados, embutidos, faena |
| `lacteos-derivados` | Lácteos y Derivados | leche, queso, manteca, yogur, cámara frigorífica |
| `panaderia-pasteleria-industrial` | Panadería y Pastelería Industrial | pan, galletitas, masas, amasados, premezclas |
| `envasado-conservas` | Envasado, Conservas y Encurtidos | conservas, enlatado, pasteurización, esterilización |
| `molineria-cereales` | Molinería y Cereales | harina, sémola, maíz, molienda, almidón |
| `bebidas-alcoholicas` | Bebidas Alcohólicas | vinos, cervezas, sidra, espirituosas, destilados |
| `bebidas-no-alcoholicas` | Bebidas No Alcohólicas | agua mineral, gaseosas, jugos, energizantes, té |
| `aceites-grasas-vegetales` | Aceites y Grasas Vegetales | aceite de girasol, soja, maíz, margarina |
| `condimentos-especias` | Condimentos y Especias | sal, pimienta, aderezos, especias, salsas |
| `alimentos-congelados` | Alimentos Congelados y Precocidos | precocidos, congelados, minutas, comidas listas |
| `ingredientes-aditivos` | Ingredientes y Aditivos Alimentarios | colorantes, conservantes, emulsionantes, aromas |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-A01 | Habilitación SENASA (RNPA y RNOE) | Todas |
| D-A02 | Habilitación ANMAT (si comercializa en todo el país) | Todas |
| D-A03 | Habilitación municipal bromatológica | Todas |
| D-A04 | Certificado BPM (Buenas Prácticas de Manufactura) | Todas |
| D-A05 | Plan HACCP implementado | `procesamiento-carnes`, `lacteos-derivados`, `bebidas-alcoholicas` |
| D-A06 | Habilitación INPI (marcas) si aplica | Condicional |
| D-A07 | Certificación Kosher o Halal (si aplica) | Condicional |
| D-A08 | Carnet de manipulador de alimentos del personal | Todas |

---

## 👕 SECTOR 04 — TEXTIL, INDUMENTARIA Y CALZADO

**Descripción:** Fabricación y confección de prendas, telas, calzado e insumos textiles.
**Slug padre:** `textil-indumentaria-calzado`
**Aliases padre:** textil, ropa, confección, telas, indumentaria, calzado, uniformes

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `confeccion-indumentaria` | Confección de Indumentaria | costura, confección, ropa, talles, prendas |
| `tejidos-telas` | Tejidos y Telas | telas, tejido de punto, telares, hilados |
| `indumentaria-laboral-epp` | Indumentaria Laboral y EPP | ropa de trabajo, mameluco, chaleco, casco, calzado de seguridad |
| `bordado-estampado` | Bordado y Estampado | serigrafía, bordado, sublimación, transfer, estampa |
| `calzado-marroquineria` | Calzado e Industria del Cuero | zapatos, botas, corte y costura cuero, marroquinería |
| `blanqueria-lenceria-industrial` | Blanquería y Lencería Industrial | sábanas, toallas, uniformes hoteleros, industrial |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-T01 | Registro de Marca (INPI) si aplica | Condicional |
| D-T02 | Certificación EPP (IRAM/normas internacionales) | `indumentaria-laboral-epp` |
| D-T03 | Habilitación municipal de taller | Todas |
| D-T04 | Registro en SEAM (si tiene personal costurero registrado) | `confeccion-indumentaria` |

---

## 🏗️ SECTOR 05 — CONSTRUCCIÓN, MATERIALES Y AFINES

**Descripción:** Provisión de materiales para la construcción civil e industrial, y empresas constructoras.
**Slug padre:** `construccion-materiales`
**Aliases padre:** construcción, obras, hormigón, cemento, ladrillos, cerámicas, instalaciones

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `hormigon-premoldeados` | Hormigón, Premoldeados y Prefabricados | hormigón, premoldeados, viguetas, columnas, pozos |
| `ceramicas-revestimientos` | Cerámicas, Porcellanatos y Revestimientos | baldosas, porcelanato, azulejos, revestimiento |
| `carpinteria-aberturas` | Carpintería y Aberturas | puertas, ventanas, aberturas de madera/aluminio/PVC |
| `impermeabilizacion-aislacion` | Impermeabilización y Aislación | membranas, poliuretano, lana de vidrio, aislación térmica |
| D| `construccion-civil-industrial` | Construcción Civil e Industrial | obras civiles, galpones, depósitos, edificios industriales |
| `demolicion-movimiento-tierras` | Demolición y Movimiento de Tierras | demolición, excavación, nivelación, relleno, vialidad |
| `pinturas-construccion` | Pinturas y Revestimientos para la Construcción | pintura látex, esmalte, impermeabilizante, microcemento |
| `sanitaria-plomeria` | Instalaciones Sanitarias y Plomería | cañerías, plomería, sanitarios, desagüe, agua caliente |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-C01 | Matrícula profesional del director técnico (ingeniero/arquitecto) | `construccion-civil-industrial` |
| D-C02 | Inscripción en Registro de Constructores Provincial | `construccion-civil-industrial` |
| D-C03 | Seguro de Accidentes de Trabajo (ART) | Todas |
| D-C04 | Certificado de libre deuda previsional | Todas |

---

## 🛢️ SECTOR 06 — PLÁSTICOS, CAUCHO Y ENVASES

**Slug padre:** `plasticos-caucho-envases`
**Aliases padre:** plástico, caucho, goma, envases, bolsas, packaging industrial

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `inyeccion-plasticos` | Inyección y Soplado de Plásticos | inyección, soplado, termoplásticos, moldes plásticos |
| `envases-plasticos` | Envases y Embalajes Plásticos | botellas, bidones, bolsas, film, packaging |
| `caucho-gomas-industriales` | Caucho y Gomas Industriales | juntas, sellos, mangueras, correas, perfiles de goma |
| `espumas-poliuretano` | Espumas y Poliuretano | espumas, poliuretano, colchones industriales |
| `fibra-vidrio-composites` | Fibra de Vidrio y Composites | fibra de vidrio, resinas, GRP, FRP, composites |

---

## 🌳 SECTOR 07 — MADERA, MUEBLES Y PAPEL

**Slug padre:** `madera-muebles-papel`
**Aliases padre:** madera, muebles, aserradero, papel, cartón, imprenta

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `aserradero-madera` | Aserradero y Madera Aserrada | madera, tablones, listones, aserrado, secado |
| `muebles-amoblamiento-industrial` | Muebles e Insumos para la Industria | estanterías, racks, muebles de oficina, amoblamiento industrial |
| `carpinteria-industrial` | Carpintería Industrial y MDF | melamina, MDF, tableros, machihembrado |
| `papel-carton-embalaje` | Papel, Cartón y Embalaje | papel, cartón corrugado, cajas, embalaje secundario |
| `imprenta-grafica` | Imprenta y Gráfica Industrial | impresión offset, digital, etiquetas, rótulos, flyers |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-MD01 | Certificado de Origen de Madera (cadena de custodia) si aplica | `aserradero-madera` |
| D-MD02 | Habilitación municipal para aserraderos | `aserradero-madera` |

---

## ⚡ SECTOR 08 — ELECTRÓNICA, TECNOLOGÍA Y TELECOMUNICACIONES

**Slug padre:** `electronica-tecnologia-telecomunicaciones`
**Aliases padre:** electrónica, tecnología, informática, telecomunicaciones, automatización

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `fabricacion-equipos-electronicos` | Fabricación de Equipos Electrónicos | PCB, plaquetas, tableros electrónicos, ensamble |
| `automatizacion-robotica` | Automatización y Robótica | PLC, SCADA, robots, automatización industrial, control |
| `instrumentacion-medicion` | Instrumentación y Medición | sensores, medidores, calibración, transductores |
| `desarrollo-software-industria` | Desarrollo de Software Industrial | SCADA, MES, ERP, software a medida |
| `telecomunicaciones-redes` | Telecomunicaciones y Redes | fibra óptica, redes industriales, WiFi industrial, radiocomunicación |
| `paneles-tableros-electricos` | Tableros y Paneles Eléctricos | tableros eléctricos, centros de control, CCM |
| `energias-renovables` | Energías Renovables | solar, fotovoltaico, eólico, paneles solares |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-E01 | Habilitación ENACOM (equipos de telecomunicaciones) | `telecomunicaciones-redes` |
| D-E02 | Matrícula del técnico electrónico habilitado | `fabricacion-equipos-electronicos`, `paneles-tableros-electricos` |
| D-E03 | Certificación de productos ante organismos de control (IRAM/IEC) | Condicional |

---

## 🚗 SECTOR 09 — AUTOMOTRIZ Y AUTOPARTES

**Slug padre:** `automotriz-autopartes`
**Aliases padre:** automotriz, autopartes, vehículos, repuestos, carrocería

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `fabricacion-autopartes` | Fabricación de Autopartes | autopartes, piezas para autos, componentes automotrices |
| `carroceria-vehiculos-especiales` | Carrocería y Vehículos Especiales | carrocerías, semirremolques, acoplados, zorras |
| `rectificacion-motores` | Rectificación de Motores | rectificado, motor, cigüeñal, árbol de levas |
| `tapiceria-automotriz` | Tapicería e Interior Automotriz | tapicería, butacas, alfombras, paneles de puertas |
| `servicios-automotrices` | Servicios Automotrices Industriales | mecánica pesada, lubricación de flotas, diagnóstico |

---

## 🚛 SECTOR 10 — LOGÍSTICA, TRANSPORTE Y DEPÓSITO

**Slug padre:** `logistica-transporte-deposito`
**Aliases padre:** logística, transporte, flete, depósito, almacenamiento, distribución

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `transporte-cargas-generales` | Transporte de Cargas Generales | camiones, fletes, camioneta, transporte |
| `transporte-cargas-peligrosas` | Transporte de Cargas Peligrosas | materiales peligrosos, ADR, sustancias peligrosas |
| `logistica-almacenamiento` | Logística y Almacenamiento | depósito, almacén, stock, 3PL, cross-docking |
| `transporte-frigorífico` | Transporte Frigorífico | cadena de frío, camión refrigerado, frigorífico móvil |
| `mudanzas-industriales` | Mudanzas y Traslados Industriales | mudanza, traslado de maquinaria, rigging |
| `servicio-grua-elevacion` | Grúas y Servicio de Elevación | grúa, autoelevador, montacargas, manipulación de cargas |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-L01 | Habilitación CNRT (transporte interjurisdiccional) | `transporte-cargas-generales`, `transporte-cargas-peligrosas` |
| D-L02 | Habilitación DGRT / organismo provincial | Todas |
| D-L03 | Permiso especial para cargas peligrosas (RNTRC) | `transporte-cargas-peligrosas` |
| D-L04 | Seguro de carga y responsabilidad de transporte | Todas |
| D-L05 | Habilitación habilitación frigorífica (SENASA) | `transporte-frigorifico` |

---

## ⚙️ SECTOR 11 — MANTENIMIENTO INDUSTRIAL (SERVICIOS)

> Este sector aplica principalmente a **Proveedores** externos que prestan servicios dentro del parque.

**Slug padre:** `mantenimiento-industrial`
**Aliases padre:** mantenimiento, reparación, service, técnico, mecánico, eléctrico

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `mantenimiento-mecanico` | Mantenimiento Mecánico | reparación mecánica, ajuste, lubricación, mecánico |
| `mantenimiento-electrico` | Mantenimiento Eléctrico e Instrumental | electricista industrial, mantenimiento eléctrico, instrumental |
| `mantenimiento-electronico` | Mantenimiento Electrónico y Automatización | PLC, variador, servo, reparación electrónica industrial |
| `mantenimiento-hidraulico-neumatico` | Hidráulica y Neumática | hidráulica, neumática, pistones, válvulas, cilindros |
| `mantenimiento-edilicio` | Mantenimiento Edilicio | pintura, plomería, electricidad civil, gasista |
| `mantenimiento-refrigeracion` | Refrigeración y Aire Acondicionado | HVAC, aire acondicionado, cámaras frías, refrigeración |
| `soldadura-servicio` | Soldadura (Servicio) | soldador, corte, reparación metálica in situ |
| `lubricacion-predictivo` | Lubricación y Mantenimiento Predictivo | lubricación, análisis vibracional, ultrasonido, termografía |

### Documentación específica (Proveedores de Mantenimiento)

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-MN01 | Matrícula habilitante (electricista matriculado / gasista / etc.) | Según especialidad |
| D-MN02 | ART con cláusula de no repetición a favor del contratante | Todas |
| D-MN03 | Certificados de capacitación del personal (MEP, trabajo en altura, espacios confinados) | Según tarea |
| D-MN04 | Seguro de equipos propios (si trae herramientas/maquinaria) | Condicional |

---

## ⚡ SECTOR 12 — ENERGÍA, GAS Y UTILITIES

**Slug padre:** `energia-gas-utilities`
**Aliases padre:** energía, gas, electricidad, generación, utilities, agua industrial

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `instalaciones-electricas` | Instalaciones Eléctricas Industriales | instalación eléctrica, alta tensión, baja tensión, tableros |
| `instalaciones-gas` | Instalaciones de Gas Industrial | gas natural, GNC, GLP, cañería de gas, gasista |
| `grupos-electrogenos` | Grupos Electrógenos y UPS | generador, grupo electrógeno, UPS, corte de luz |
| `eficiencia-energetica` | Eficiencia Energética | ahorro energético, auditoría energética, LED industrial |
| `agua-tratamiento-efluentes` | Agua y Tratamiento de Efluentes | planta de tratamiento, efluentes, agua industrial, osmosis |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-EN01 | Matrícula de electricista matriculado provincial | `instalaciones-electricas` |
| D-EN02 | Matrícula de gasista matriculado | `instalaciones-gas` |
| D-EN03 | Habilitación de autoridad de cuenca (ACUMAR / provincial) | `agua-tratamiento-efluentes` |

---

## 🧹 SECTOR 13 — SERVICIOS GENERALES Y FACILITIES

**Slug padre:** `servicios-generales-facilities`
**Aliases padre:** limpieza, seguridad, facilities, catering, jardinería, residuos

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `limpieza-industrial` | Limpieza Industrial | limpieza, higiene industrial, aseo, fumigación |
| `seguridad-privada` | Seguridad Privada y Vigilancia | vigilancia, seguridad, control de acceso, CCTV |
| `gestion-residuos` | Gestión de Residuos Industriales | residuos peligrosos, reciclado, disposición final, GIRSU |
| `catering-comedores` | Catering y Comedores Industriales | comedor, viandas, catering, servicio de comidas |
| `paisajismo-parquizacion` | Paisajismo y Parquización | jardín, parque, cesped, forestación industrial |
| `control-plagas` | Control de Plagas y Fumigación | plagas, fumigación, desratización, desinsectación |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-SG01 | Habilitación APRA / organismo ambiental para residuos | `gestion-residuos` |
| D-SG02 | Habilitación prestador de seguridad (Ministerio de Seguridad) | `seguridad-privada` |
| D-SG03 | Registro de aplicadores habilitados (Senasa/provincia) | `control-plagas` |
| D-SG04 | Carnés de manipulador de alimentos | `catering-comedores` |
| D-SG05 | Habilitación municipal del establecimiento | `catering-comedores` |

---

## 🔩 SECTOR 14 — INSUMOS, HERRAMIENTAS Y EQUIPOS INDUSTRIALES

**Slug padre:** `insumos-herramientas-equipos`
**Aliases padre:** insumos, herramientas, repuestos, equipos, maquinaria, rodamientos

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `herramientas-manuales` | Herramientas Manuales | llaves, destornilladores, alicates, herramientas mano |
| `herramientas-electricas-neumaticas` | Herramientas Eléctricas y Neumáticas | taladro, amoladora, atornillador, sierra, neumáticas |
| `repuestos-rodamientos` | Repuestos y Rodamientos | rodamientos, retenes, cadenas, piñones, repuestos |
| `maquinaria-equipos` | Maquinaria y Equipos Industriales | máquinas, equipos industriales, usados o nuevos |
| `elementos-seguridad-epp` | Elementos de Seguridad (EPP) | casco, guantes, arnés, botines, ropa de trabajo, EPP |
| `consumibles-abrasivos` | Consumibles y Abrasivos | discos, lijas, electrodos, brocas, consumibles soldadura |

---

## 🏥 SECTOR 15 — SALUD OCUPACIONAL Y SEGURIDAD E HIGIENE

**Slug padre:** `salud-ocupacional-higiene`
**Aliases padre:** salud, seguridad e higiene, medicina laboral, ART, HSEC

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `medicina-laboral` | Medicina Laboral y Pre-ocupacional | examen médico, preocupacional, periódico, medicina laboral |
| `seguridad-higiene-consultoria` | Consultoría en Seguridad e Higiene | SHE, HSEC, técnico seguridad, auditoría de seguridad |
| `capacitacion-seguridad` | Capacitación en Seguridad | cursos, capacitación, primeros auxilios, evacuación, brigadistas |
| `equipamiento-emergencias` | Equipamiento para Emergencias | extintores, botiquines, desfibriladores, señalética |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-SH01 | Matrícula de Técnico/Licenciado en H y S (SRT) | `seguridad-higiene-consultoria` |
| D-SH02 | Habilitación del médico (matrícula provincial) | `medicina-laboral` |
| D-SH03 | Habilitación del establecimiento médico | `medicina-laboral` |

---

## 📊 SECTOR 16 — SERVICIOS PROFESIONALES Y CONSULTORÍA

**Slug padre:** `servicios-profesionales`
**Aliases padre:** consultoría, estudio, asesoría, contable, legal, ingeniería

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `contabilidad-impuestos` | Contabilidad, Impuestos y Auditoría | contador, estudio contable, impuestos, AFIP, auditoría |
| `asesoria-legal-laboral` | Asesoría Legal y Laboral | abogado, estudio jurídico, laboral, contratos, BCRA |
| `ingenieria-consultora` | Ingeniería y Consultoría Técnica | consultoría de ingeniería, proyectos, dirección de obra |
| `recursos-humanos-seleccion` | Recursos Humanos y Selección de Personal | RRHH, búsqueda, selección, headhunting, capacitación |
| `marketing-comunicacion` | Marketing y Comunicación Industrial | diseño, marketing, comunicación, web, redes |
| `informatica-sistemas` | Informática, Sistemas y Soporte IT | soporte IT, sistemas, software, hardware, redes |
| `certificaciones-normas` | Certificaciones y Normalización | ISO, IRAM, certificaciones, auditoría de calidad |
| `gestion-ambiental` | Gestión Ambiental y Sustentabilidad | medio ambiente, RSE, auditoría ambiental, ISO 14001 |

---

## 🌾 SECTOR 17 — AGROPECUARIO Y MAQUINARIA AGRÍCOLA

**Slug padre:** `agropecuario-maquinaria-agricola`
**Aliases padre:** agro, agricultura, maquinaria agrícola, cosecha, ganadería, semillas

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `maquinaria-agricola` | Maquinaria Agrícola | tractor, cosechadora, sembradora, pulverizadora, implementos |
| `insumos-agricolas` | Insumos Agrícolas | semillas, fertilizantes, agroquímicos, siembra |
| `ganaderia-porcicultura` | Ganadería y Porcicultura | bovinos, porcinos, avicultura, tambos |
| `riego-infraestructura-rural` | Riego e Infraestructura Rural | riego, silos, galpones rurales, infraestructura agropecuaria |

---

## 🧱 SECTOR 18 — MINERALES NO METÁLICOS Y CERÁMICA INDUSTRIAL

**Slug padre:** `minerales-ceramica-industrial`
**Aliases padre:** cerámica, vidrio, refractarios, cal, cemento, minerales

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `vidrio-cristal-industrial` | Vidrio y Cristal Industrial | vidrio templado, cristal, vidriería industrial |
| `refractarios-aislantes` | Refractarios y Aislantes Térmicos | ladrillos refractarios, fibra cerámica, lana mineral |
| `cal-yeso-cementos` | Cal, Yeso y Cementos Especiales | cal, yeso, cemento blanco, mezclas especiales |

---

## 💊 SECTOR 19 — FARMACÉUTICA, COSMÉTICA Y ARTÍCULOS MÉDICOS

**Slug padre:** `farmaceutica-cosmetica-medicos`
**Aliases padre:** farmacia, laboratorio, cosmética, artículos médicos, descartables

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `laboratorio-farmaceutico` | Laboratorio Farmacéutico | medicamentos, fármacos, elaboración, ANMAT |
| `cosmetica-perfumeria-industrial` | Cosmética y Perfumería Industrial | cosméticos, perfumes, higiene personal, ANMAT |
| `articulos-medicos-descartables` | Artículos Médicos y Descartables | descartables, guantes quirúrgicos, artículos médicos |

### Documentación específica

| Código | Documento | Aplica a |
|--------|-----------|----------|
| D-F01 | Habilitación ANMAT para el establecimiento | Todas |
| D-F02 | Director técnico farmacéutico matriculado | Todas |
| D-F03 | Registro de producto ante ANMAT | Por producto |

---

## 🖨️ SECTOR 20 — GRÁFICA, SEÑALÉTICA Y PUBLICIDAD INDUSTRIAL

**Slug padre:** `grafica-senaletica-publicidad`
**Aliases padre:** gráfica, señalética, cartelería, publicidad, impresión, rotulación

### Subcategorías

| Slug | Nombre visible | Aliases de búsqueda |
|------|---------------|-------------------|
| `carteleria-senaletica` | Cartelería y Señalética Industrial | carteles, señalética, rotulación, vinilo, letreros |
| `impresion-gran-formato` | Impresión Digital y Gran Formato | plotter, banner, lona, impresión digital |
| `packaging-diseño-industrial` | Packaging y Diseño Industrial | diseño de packaging, envases, etiquetas, branding industrial |

---

## 🔄 RESUMEN ESTADÍSTICO

| Sector | N° Subcategorías |
|--------|:----------------:|
| 01 - Metalmecánica | 10 |
| 02 - Química | 8 |
| 03 - Alimentaria | 11 |
| 04 - Textil | 6 |
| 05 - Construcción | 8 |
| 06 - Plásticos | 5 |
| 07 - Madera y Papel | 5 |
| 08 - Electrónica | 7 |
| 09 - Automotriz | 5 |
| 10 - Logística | 6 |
| 11 - Mantenimiento | 8 |
| 12 - Energía | 5 |
| 13 - Servicios Generales | 6 |
| 14 - Insumos y Herramientas | 6 |
| 15 - Salud Ocupacional | 4 |
| 16 - Servicios Profesionales | 8 |
| 17 - Agropecuario | 4 |
| 18 - Minerales y Cerámica | 3 |
| 19 - Farmacéutica | 3 |
| 20 - Gráfica | 3 |
| **TOTAL** | **126 subcategorías** |

---

## 🗄️ SEED SQL — Estructura base para Supabase

```sql
-- INSTRUCCIÓN DE USO:
-- 1. Insertar primero los rubros padre (sin categoria_padre_id)
-- 2. Luego insertar las subcategorías referenciando el UUID del padre
-- 3. Insertar aliases en alias_categorias

-- Ejemplo para el primer sector:
INSERT INTO categorias (id, nombre, descripcion, slug, categoria_padre_id, orden, activa)
VALUES (
  gen_random_uuid(),
  'Metalmecánica y Metalurgia',
  'Empresas que trabajan metales mediante procesos de transformación, fabricación o tratamiento.',
  'metalmecanica-metalurgia',
  NULL,  -- Es padre
  1,
  true
);

-- Alias para ese padre:
INSERT INTO alias_categorias (id, categoria_id, alias)
SELECT gen_random_uuid(), id, unnest(ARRAY['metalurgia','metal','acero','hierro','chapa','soldadura','fundición'])
FROM categorias WHERE slug = 'metalmecanica-metalurgia';
```

---

## 📝 NOTAS DE IMPLEMENTACIÓN

1. **Buscador:** La tabla `alias_categorias` es crítica. Cada subcategoría debe tener al menos 5-8 aliases para cubrir jerga industrial argentina (ej: "tornero" = tornería, "vulcanizado" = caucho).

2. **Documentación dinámica:** Se recomienda modelar los requisitos documentales en una tabla `requisitos_documentales` vinculada a `categorias`, con campos: `nombre_doc`, `obligatorio` (bool), `descripcion`. Así el Admin puede configurarlos desde el panel sin cambiar código.

3. **Applies_to:** Considerar un flag `aplica_empresa` / `aplica_proveedor` en la tabla de categorías para filtrar el catálogo según el tipo de entidad que se registra.

4. **Categorías de Mantenimiento:** El Sector 11 es especialmente relevante para los **Proveedores** (no empresas del parque). En la UI, al registrarse como Proveedor, mostrar este sector como primero.

5. **Revisión con UIAB:** Antes de hacer el seed definitivo, validar con la administración de UIAB qué rubros ya existen en sus planillas actuales para hacer el match y no duplicar.
