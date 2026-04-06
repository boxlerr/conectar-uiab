# SCOPE UPDATE v1.1 — Conectar UIAB
> **Vaxler Software · Confidencial · Abril 2026**  
> Este documento reemplaza y amplía las definiciones del SRS original en cuanto al alcance geográfico y de usuarios de la plataforma.

---

## ⚠️ La Regla Fundamental — Leer antes de escribir cualquier código

**La plataforma NO es exclusiva del Parque Industrial de Almirante Brown.**

Es el directorio comercial y de servicios de **todo el Partido de Almirante Brown**. Puede registrarse cualquier empresa o profesional del partido: una fábrica de 500 empleados, una panadería, un gasista matriculado, una clínica, una inmobiliaria o un taller mecánico.

**No hardcodear referencias al Parque Industrial en copy, validaciones ni lógica de negocio.**

---

## 1. Cambio de Scope — Antes vs. Ahora

| | SRS Original | Scope v1.1 (actual) |
|---|---|---|
| **Usuarios** | Solo empresas del Parque Industrial | Cualquier empresa del Partido de Almirante Brown |
| **Proveedores** | Perfil industrial exclusivamente | Servicios generales (oficios, PyMEs, profesionales) |
| **Acceso** | Directorio privado intra-parque | Directorio ampliado: industria + comercio + servicios |
| **Ejemplos excluidos antes** | Panadería, peluquería, clínica | Ahora todos están dentro del scope |
| **Tagline** | "Red industrial de confianza" | "El directorio comercial de Almirante Brown" |

---

## 2. Tipos de Usuario — Definición Correcta

### 🏢 ROL: EMPRESA

**Quién es:** Cualquier empresa legalmente constituida del Partido de Almirante Brown, sin importar rubro ni tamaño. Incluye: fábricas, comercios, restaurantes, clínicas, estudios profesionales, panaderías, inmobiliarias, etc.

**Qué puede hacer:** Publicar su perfil en el directorio, cargar su catálogo de productos o servicios, buscar proveedores, enviar solicitudes de presupuesto (RFQ) y recibir reseñas.

| | |
|---|---|
| ✅ **Copy correcto** | *"Empresa, comercio o emprendimiento con actividad en Almirante Brown."* |
| ❌ **Copy INCORRECTO** | *"Planta industrial, fábrica o gerencia del parque."* |

---

### 🔧 ROL: PROVEEDOR

**Quién es:** Profesional independiente, técnico matriculado o empresa prestadora de servicios que ofrece servicios a otras empresas o particulares. Incluye: gasistas, techistas, electricistas, plomeros, diseñadores, contadores, programadores, mecánicos, pintores, etc.

**Qué puede hacer:** Publicar su perfil de servicios, aparecer en el buscador, recibir consultas y cotizaciones, y gestionar su reputación mediante reseñas verificadas.

| | |
|---|---|
| ✅ **Copy correcto** | *"Profesional independiente, técnico o prestador de servicios de cualquier rubro."* |
| ❌ **Copy INCORRECTO** | *"Profesional independiente, técnico o empresa de servicios especialista para industrias del parque."* |

---

## 3. Copy Prohibido vs. Copy Correcto

| Contexto | ❌ INCORRECTO | ✅ CORRECTO |
|---|---|---|
| **Selección de rol en registro** | "Busco acceder al tablero operativo, encontrar proveedores formales y enviar cotizaciones." | "Publicá tu empresa o comercio en el directorio de Almirante Brown. Encontrá proveedores y enviá cotizaciones." |
| **Descripción del rol Proveedor** | "Profesional independiente, técnico o empresa de servicios especialista. Busco ofrecer mis servicios a las industrias del parque." | "Profesional, técnico o prestador de servicios. Publicá tus servicios y recibí consultas de empresas y particulares de Almirante Brown." |
| **Hero / tagline landing** | "Red industrial de confianza" / "Conectamos Industria con Profesionales" | "El directorio comercial de Almirante Brown" / "Conectamos empresas y profesionales del partido" |
| **Descripción general** | "La plataforma de la UIAB que une a las empresas del Parque Industrial de Almirante Brown con proveedores verificados." | "La plataforma de la UIAB que conecta empresas, comercios y profesionales de todo el Partido de Almirante Brown." |
| **Validaciones / onboarding** | "Tu empresa debe pertenecer al Parque Industrial para registrarse." | "Tu empresa o negocio debe tener actividad en el Partido de Almirante Brown." |
| **Filtros de búsqueda** | Filtro: "Solo empresas del parque" | Filtro: "Zona / Localidad dentro de Almirante Brown" (Burzaco, Longchamps, Rafael Calzada, etc.) |

> **Regla de oro:** El nombre "Parque Industrial" puede aparecer SOLO cuando hace referencia a la UIAB como entidad administradora, nunca como límite del público.

---

## 4. Impacto Directo en el Código

### `tipo_empresa` / `tipo_proveedor`
No limitar los valores a rubros industriales. El campo debe aceptar:
```
empresa | comercio | gastronomia | salud | educacion | servicios_generales | monotributista | profesional_independiente | particular
```

### Validaciones de registro
- **NO** validar que el CUIT o la dirección pertenezca al Parque Industrial.
- Validar solo que sea un CUIT argentino válido y que la localidad esté dentro del Partido de Almirante Brown.

### Categorías en seed / base de datos
- El seed debe incluir los **26 sectores** (20 originales + 6 nuevos del Scope Update v1.1).
- No filtrar categorías para mostrar solo sectores industriales en el formulario de registro.
- Ver sección 6 de este documento para el listado completo de sectores nuevos.

### Filtros del directorio
El filtro de localidad/zona debe incluir todas las localidades del Partido:
```
Burzaco | Longchamps | Rafael Calzada | Glew | Adrogué | Claypole | Malvinas Argentinas | San José | Ministro Rivadavia | Presidente Perón (limítrofe)
```

### Emails transaccionales
No referenciar "el parque" en asuntos ni cuerpos de email. Usar "Almirante Brown" o "la plataforma Conectar UIAB".

### Metadata y SEO (landing pública)
```html
<!-- INCORRECTO -->
<meta name="description" content="Red industrial del Parque de Almirante Brown">

<!-- CORRECTO -->
<meta name="description" content="Directorio de empresas y profesionales del Partido de Almirante Brown">
```

### Constantes y i18n strings
Buscar y reemplazar en todo el codebase:

| Buscar | Reemplazar por |
|---|---|
| `"parque industrial"` | `"Almirante Brown"` |
| `"industrias del parque"` | `"empresas de Almirante Brown"` |
| `"empresas del parque"` | `"empresas del partido"` |
| `"red industrial"` | `"directorio comercial"` |

---

## 5. Qué NO cambia

- ✅ **Stack tecnológico:** Next.js · Node.js/NestJS · PostgreSQL · Supabase · MercadoPago
- ✅ **Schema de BD:** La estructura actual ya soporta el scope ampliado sin modificaciones estructurales
- ✅ **Flujo de aprobación:** El Admin de la UIAB sigue siendo el gatekeeper. Todo requiere aprobación
- ✅ **Roles del sistema:** Admin / Empresa / Proveedor — sin cambios en RBAC
- ✅ **Módulos del MVP:** Directorio, Fichas, Catálogo, RFQ, Reseñas, Suscripciones, Panel Admin
- ✅ **Documentación base requerida:** CUIT, habilitación municipal, seguro de responsabilidad civil
- ✅ **Integración MercadoPago:** Para cobro de suscripciones mensuales
- ✅ **Plazo:** 3 semanas de desarrollo + 5 semanas de estabilización

---

## 6. Sectores Nuevos — Agregar al Seed de Categorías

Los siguientes 6 sectores deben sumarse a los 20 originales del PDF de categorías:

### Sector 21 — Gastronomía y Alimentos
> Establecimientos de elaboración, venta y distribución de alimentos y bebidas para consumo directo.

**Aliases:** gastronomia, restaurant, panaderia, cafeteria, rotiseria, comidas, catering, bar

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `panaderia-pasteleria` | Panadería y Pastelería | panaderia, facturas, medialunas, confiteria |
| `restaurant-rotiseria` | Restaurant y Rotisería | restaurant, comidas, rotiseria, minutas, delivery |
| `cafeteria-bar` | Cafetería y Bar | cafe, bar, cafeteria, infusiones |
| `catering-eventos` | Catering y Eventos | catering, eventos, banquetes, viandas empresariales |
| `elaboracion-alimentos` | Elaboración de Alimentos | fabrica de pastas, reposteria, elaboracion propia |
| `distribuidora-alimentos` | Distribuidora de Alimentos | mayorista alimentos, distribucion, almacen |

**Documentación específica:** D-GA01 Habilitación bromatológica municipal · D-GA02 Carnet manipulador de alimentos · D-GA03 Habilitación ANMAT (si comercializa envasados)

---

### Sector 22 — Salud, Estética y Bienestar
> Prestadores de servicios de salud, estética, deporte y bienestar personal.

**Aliases:** salud, medico, clinica, estetica, belleza, gym, bienestar, farmacia

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `clinica-consultorio` | Clínica y Consultorio | medico, clinica, pediatra, odontologo, psicologo |
| `veterinaria` | Veterinaria | veterinario, animales, mascotas |
| `farmacia-optica` | Farmacia y Óptica | farmacia, optica, ortopedia, medicamentos |
| `estetica-belleza` | Estética y Belleza | peluqueria, estetica, manicuria, barber |
| `gimnasio-deporte` | Gimnasio y Deporte | gym, gimnasio, pilates, crossfit |

**Documentación específica:** D-SA01 Matrícula profesional · D-SA02 Habilitación municipal · D-SA03 Habilitación ANMAT (farmacias)

---

### Sector 23 — Comercio Minorista y Mayorista
> Comercios de venta al público o a empresas de productos de cualquier rubro.

**Aliases:** comercio, negocio, tienda, local, mayorista, minorista, venta

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `electrodomesticos-electronica` | Electrodomésticos y Electrónica | electrodomesticos, celulares, computadoras |
| `ferreteria-corralon` | Ferretería y Corralón | ferreteria, corralon, materiales, herramientas |
| `indumentaria-calzado-retail` | Indumentaria y Calzado | ropa, calzado, accesorios, moda |
| `librerias-papeleria` | Librería y Papelería | libreria, papeleria, utiles, imprenta |
| `mayorista-distribucion` | Mayorista y Distribución | mayorista, distribucion, proveedor de comercios |

**Documentación específica:** D-CM01 Habilitación municipal comercial · D-CM02 Inscripción AFIP activa

---

### Sector 24 — Educación y Capacitación
> Instituciones educativas, centros de capacitación, tutores y formación profesional.

**Aliases:** educacion, capacitacion, cursos, escuela, instituto, formacion, tutoria

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `instituto-educativo` | Instituto Educativo | colegio, escuela, jardin, terciario |
| `capacitacion-laboral` | Capacitación Laboral | cursos, certificaciones, formacion profesional |
| `tutoria-apoyo-escolar` | Tutoría y Apoyo Escolar | tutor, apoyo escolar, clases particulares |
| `idiomas` | Idiomas | ingles, portugues, clases de idioma |

**Documentación específica:** D-ED01 Habilitación provincial (institutos formales) · D-ED02 Matrícula docente

---

### Sector 25 — Inmobiliario y Alquileres
> Inmobiliarias, desarrolladores, alquiler de espacios y propiedades.

**Aliases:** inmobiliaria, alquiler, venta de propiedades, real estate, local comercial

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `inmobiliaria-venta-alquiler` | Inmobiliaria | propiedades, venta, alquiler |
| `alquiler-espacios-comerciales` | Alquiler de Espacios | local comercial, galpon, oficina, coworking |
| `desarrolladora-constructora` | Desarrolladora | loteo, barrios, desarrollo inmobiliario |

**Documentación específica:** D-IN01 Matrícula de corredor inmobiliario · D-IN02 Habilitación municipal

---

### Sector 26 — Automotriz y Servicios Vehiculares (Civiles)
> Talleres, lavaderos, gomería y servicios para vehículos de uso particular y comercial.  
> *(Distinto del Sector 09 que cubre fabricación de autopartes para industria)*

**Aliases:** taller, gomeria, lavadero, auto, moto, vehiculo, mecanica civil

| Slug | Nombre visible | Aliases principales |
|---|---|---|
| `taller-mecanico-civil` | Taller Mecánico | mecanica, taller, reparacion de autos, service |
| `gomeria` | Gomería | neumaticos, cubiertas, alineacion, balanceo |
| `lavadero-estetica` | Lavadero y Estética | lavadero, pulido, detailing |
| `concesionaria-usados` | Concesionaria y Usados | concesionaria, compra-venta autos |
| `moto-bicicleta` | Motos y Bicicletas | taller motos, bicicletas, electricas |

**Documentación específica:** D-AV01 Habilitación municipal del taller · D-AV02 ART

---

## 7. Modificaciones a Sectores Existentes

### Sector 11 — Mantenimiento Industrial
- Agregar subcategoría: **`oficios-civiles-generales`**
  - Nombre visible: *Oficios y Servicios Civiles Generales*
  - Aliases: `plomero, gasista, techista, pintor civil, albanil, cerrajero, instalador, fumigador`
- Ampliar aliases del sector: agregar `plomero, gasista particular, techista, pintor civil, albanil, cerrajero`
- Agregar documentación: **D-MN05** Matrícula habilitante municipal según oficio

### Sector 13 — Servicios Generales y Facilities
- Ampliar descripción: incluir servicios para empresas comerciales, no solo industriales
- Agregar aliases: `servicios para empresas, outsourcing, servicios de apoyo`
- Agregar subcategoría: **`mensajeria-cadetes`** (aliases: mensajería, cadetes, delivery comercial, reparto)

### Sector 16 — Servicios Profesionales y Consultoría
- Ampliar descripción: no limitarlo a "para la industria", incluir servicios a comercios y emprendimientos
- Agregar subcategoría: **`diseno-arquitectura`** (arquitecto, decoración de interiores, planos, renders)
- Agregar subcategoría: **`fotografia-audiovisual`** (fotografía comercial, video institucional, drones)

### Portada / Resumen Estadístico del PDF de Categorías
- Cambiar "20 Sectores Industriales" → **"26 Sectores Comerciales e Industriales"**
- Actualizar total de subcategorías de 121 → **~160** (recalcular al finalizar seed)

---

## 8. Prompt para Pegar al Agente de Código

```
=== SCOPE UPDATE v1.1 — LEER ANTES DE ESCRIBIR CUALQUIER CÓDIGO ===

CONTEXTO ACTUALIZADO:
La plataforma Conectar UIAB NO es exclusiva del Parque Industrial.
Es el directorio comercial de TODO el Partido de Almirante Brown.

PÚBLICO OBJETIVO REAL:
- EMPRESA: Cualquier empresa, comercio o emprendimiento con actividad en
  el Partido de Almirante Brown. Incluye fábricas, panaderías, clínicas,
  inmobiliarias, restaurantes, comercios de cualquier rubro y tamaño.
- PROVEEDOR: Profesional independiente, técnico matriculado o prestador de
  servicios de cualquier rubro. Incluye gasistas, techistas, electricistas,
  plomeros, contadores, diseñadores, mecánicos, médicos, etc.

REGLAS PARA EL CÓDIGO:
1. NO escribir "parque industrial" en copy visible al usuario.
2. NO limitar validaciones de registro a rubros industriales.
3. NO filtrar categorías para mostrar solo sectores industriales.
4. Usar "Almirante Brown" o "la plataforma" como referencia geográfica.
5. El campo tipo_proveedor debe aceptar: empresa, monotributista,
   profesional_independiente, particular.
6. Los filtros de localidad deben incluir todas las localidades del
   Partido: Burzaco, Longchamps, Rafael Calzada, Glew, Adrogué, etc.
7. Los emails transaccionales NO deben referenciar "el parque".

QUÉ NO CAMBIA:
- Stack: Next.js + NestJS + PostgreSQL + Supabase + MercadoPago
- Schema de BD: ya soporta el scope ampliado sin cambios estructurales
- Flujo: Admin de UIAB sigue aprobando todo
- Roles: Admin / Empresa / Proveedor
- MVP features: Directorio, RFQ, Reseñas, Suscripciones, Panel Admin

=== FIN SCOPE UPDATE ===
```

> **Tip:** Si el agente usa un system prompt fijo (Cursor, Windsurf, Copilot), agregá este bloque como instrucción permanente al inicio del system prompt, no como mensaje de usuario. Así no lo "olvida" entre sesiones.

---

*Conectar UIAB · Scope Update v1.1 · Vaxler Software · Confidencial · Abril 2026*