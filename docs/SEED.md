# Seed de Datos Iniciales - UIAB Conecta

Archivo SQL: `supabase/migrations/20260412_seed_socios_uiab.sql`

Fuente de datos: Padrón oficial de socios UIAB (`Info Socios VAXLER.xlsx`).

---

## Qué hace la migración

| Paso | Acción |
|------|--------|
| 1 | Crea tabla `tarifas` con los 3 niveles de membresía y sus precios |
| 2 | Agrega columnas faltantes a `empresas`: `tarifa` (FK), `n_socio`, `codigo_postal`, `actividad`, `referente`, `email_referente` |
| 3 | Crea índices únicos en `categorias(slug)`, `empresas(cuit)`, `empresas_categorias(empresa_id, categoria_id)` |
| 4 | Inserta 22 categorías basadas en los rubros del padrón |
| 5 | Inserta 51 empresas socias con estado `approved` (upsert por CUIT) |
| 6 | Vincula cada empresa con su categoría en `empresas_categorias` |

---

## Tabla `tarifas`

Niveles de membresía UIAB. Los precios los actualiza el administrador.

| nivel | nombre | precio_anual (ARS) | descripcion |
|-------|--------|--------------------|-------------|
| 1 | Tarifa 1 | 108.000 | Empresas pequeñas y prestadores de servicios |
| 2 | Tarifa 2 | 216.000 | Empresas medianas con actividad industrial |
| 3 | Tarifa 3 | 360.000 | Grandes industrias y manufactureras establecidas |

La columna `empresas.tarifa` es FK a `tarifas(nivel)`.

---

## Columnas agregadas a `empresas`

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `tarifa` | smallint (FK → tarifas.nivel) | Nivel de membresía asignado por admin |
| `n_socio` | text | Nro. de socio UIAB del padrón (ej: "0074") |
| `codigo_postal` | integer | Código postal (ej: 1852) |
| `actividad` | text | Actividad económica principal (ej: "FUNDICION DE HIERRO") |
| `referente` | text | Nombre de la persona de contacto |
| `email_referente` | text | Email del referente |

---

## Categorías insertadas (22)

Basadas en el campo `rubro` del padrón. Cada categoría tiene un `slug` único.

| slug | nombre | Empresas vinculadas |
|------|--------|---------------------|
| metalurgica | Metalúrgica | ACEROS ANGELETTI, BESTCHEM, FORJA ATLAS, NAVES DEL SUR, MET. LONGCHAMPS |
| alimentos | Alimentos | ALIMENTOS FRANSRO, AKUA |
| quimica | Química | ALKANOS, DIRANSA, FINE & PURE, INDIOQUIMICA, LATIN CHEMICAL, PLAQUIMET, SEFINPOL, VELARGEN |
| construccion | Construcción | ANDARIEGA, A.D. BARBIERI, IND. CERAMICAS LOURDES, TDMA, ORMAZABAL, SAINT GOBAIN, SERVICIOS DEL PARQUE |
| poliester | Poliéster | BAYRESPLASTIC, BOLSAPEL |
| seguridad | Seguridad | CENTRAL ALERT, ROGUANT |
| autopartista | Autopartista | INDUSTRIAS GUIDI, JUNAR |
| electricidad | Electricidad | GENROD, ZOLODA |
| pinturerias | Pinturerías | BECKERS ARGENTINA, PROLAS, PULVERLUX |
| biotecnologia | Biotecnología | BIOBEST ARGENTINA |
| carpas | Carpas | CARPAS D' ANGIOLA |
| grafica | Gráfica | TGI PACK, LABELTEC |
| mayorista | Mayorista | ARCURI |
| embalajes | Embalajes | GINZUK |
| papelera | Papelera | ROLL PAPER |
| plasticos | Plásticos | POLIGSA, RPA CATAFORESIS |
| maquinarias | Maquinarias | MIGUEL ABAD |
| textil | Textil | JACQUARD TEXTILE |
| informatica | Informática | SISTEMAS DE CODIFICACION, TODO ADROGUE |
| transporte | Transporte | TRANSPORTES MORETTA |
| mantenimiento | Mantenimiento | TROX ARGENTINA |
| rep-automoviles | Reparación de Automóviles | INDUSTRIAS BACO |

**Nota:** KORUND S.A. (CUIT 30-70864148-7) no tiene rubro asignado en el padrón.

---

## Campos de `empresas` que quedan vacíos después del seed

Estos campos NO están en el padrón y quedan `NULL` para las 51 empresas:

| Campo | Impacto en matching | Nota |
|-------|---------------------|------|
| `nombre_fantasia` | Bajo | Solo visual |
| `telefono` | Nulo | Contacto directo |
| `whatsapp` | Nulo | Contacto directo |
| `descripcion` | Medio | Útil para búsqueda textual futura |
| `ruta_logo`, `bucket_logo`, `nombre_logo`, `mime_logo`, `tamano_logo_bytes` | Nulo | Imagen de perfil |
| `ruta_portada`, `bucket_portada`, `nombre_portada`, `mime_portada`, `tamano_portada_bytes` | Nulo | Imagen de portada |
| `creada_por` | Nulo | No hay user auth vinculado en seed |
| `aprobada_por` | Nulo | Idem |

---

## Datos relevantes para el algoritmo de matching

El matching (`docs/sql/matching_algorithm.sql`) usa 3 dimensiones:

| Dimensión | Puntos | Dato del seed | Estado |
|-----------|--------|---------------|--------|
| Categoría compartida | 50 pts | `empresas_categorias` ← rubro del padrón | Cubierto |
| Tags compartidos | 40 pts | `empresas_tags` | **VACÍO - requiere asignar tags a cada empresa** |
| Ubicación (localidad) | 10 pts | `empresas.localidad` (BURZACO, LONGCHAMPS, ADROGUE) | Cubierto |

**Gap crítico:** Sin `empresas_tags`, las empresas pierden hasta 40 puntos posibles en el score de matching. Se necesita poblar tags derivados de la `actividad` de cada empresa.

---

## Distribución de tarifas (51 empresas)

| Tarifa | Cantidad | Ingreso anual estimado |
|--------|----------|----------------------|
| Tarifa 1 ($108.000/año) | 28 | $3.024.000 |
| Tarifa 2 ($216.000/año) | 14 | $3.024.000 |
| Tarifa 3 ($360.000/año) | 9 | $3.240.000 |
| **Total** | **51** | **$9.288.000** |

---

## Distribución geográfica

| Localidad | Cantidad |
|-----------|----------|
| BURZACO | 47 |
| LONGCHAMPS | 3 |
| ADROGUE | 1 |
