# UIAB Conecta - Directorio Industrial y Servicios SaaS

Plataforma escalable construida sobre **Next.js 14+ (App Router)** utilizando la arquitectura de software **Feature-Sliced Design (Diseño Orientado a Módulos/Características)** para mantener el código organizado, predecible y altamente mantenible a medida que el sistema escala (suscripciones, pasarelas de pago, perfiles de proveedor, paneles de administrador, etc).

---

## 📂 Arquitectura Explicada del Proyecto

A diferencia de una arquitectura tradicional donde se mezclan 300 componentes distintos en una misma carpeta `components`, este proyecto agrupa el código dependiendo de *qué dominio de la aplicación* resuelve. Esto evita el "código espagueti" y es el estándar actual en empresas de alto nivel.

A continuación, una explicación exhaustiva de cada carpeta para que cualquier desarrollador sepa dónde poner su código.

### 1. La Capa de Enrutamiento (`src/app`)

Esta carpeta rige las URLs visibles de tu plataforma. Todo archivo llamado `page.tsx` dentro de esta carpeta representa una URL a la que el usuario puede acceder.

*   `app/page.tsx` ➔ El Inicio de la web (`/`).
*   `app/(dashboard)/` ➔ Esta carpeta usa paréntesis, lo que significa que **no** altera la URL (no existe la ruta `/dashboard/algo`), pero agrupa páginas lógicas que comparten un diseño visual (Layout) común; en este caso: el menú lateral y la barra superior para usuarios logeados.
    *   `app/(dashboard)/admin/` ➔ Panel de control exclusivo para los dueños de este software (vos). Aquí viven las URL donde verán las métricas de registro.
    *   `app/(dashboard)/empresa/` ➔ Las URLs que ven las empresas (buscadores, catálogos, su propio perfil).
    *   `app/(dashboard)/proveedor/` ➔ Las URLs que ven los proveedores (su perfil público, reseñas que les han dejado).
    *   `app/(dashboard)/configuracion/` _(Futuro)_ ➔ URLs compartidas para cambiar contraseña o foto de perfil.
*   `app/api/` ➔ Aquí vivirán los "Controladores" del Backend (Ej. Una URL especial oculta para que MercadoPago nos avise cuando un usuario pagó su plan).

### 2. La Capa de Negocio (`src/modulos`)

🔥 **¡Este es el corazón de tu aplicación!** 🔥
Casi toda la lógica, validaciones, conexiones a base de datos y componentes visuales específicos de una entidad viven acá. Se organiza por entidades lógicas:

*   `modulos/autenticacion/` ➔ Todo lo relacionado a saber "quién es el usuario".
    *   `components/AuthModal.tsx` ➔ La ventana emergente para Iniciar Sesión o Registrarse.
    *   `AuthContext.tsx` ➔ El "Cerebro" que recuerda en la memoria de la app global si el usuario es Admin, Empresa o Proveedor para así mostrarle ciertas cosas sí y otras no.
*   `modulos/empresas/` ➔ Todo lo exclusivo de una Empresa Industrial que busca servicios.
    *   `components/CompanyCard.tsx` ➔ La tarjeta visual de una empresa que se usa en el catálogo general.
    *   `actions/` ➔ (O `acciones`). Funciones puras de Servidor (Server Actions) que interactúan con la Base de Datos. Ej: `crearPublicacionDeTrabajo()` o `actualizarPerfilEmpresa()`.
*   `modulos/proveedores/` ➔ Todo lo exclusivo de un Prestador de Servicios/Profesional.
    *   `components/ProviderCard.tsx` ➔ La tarjeta visual de un proveedor para mostrar en listados.
    *   `actions/` ➔ (O `acciones`). Funciones como `responderReseña()` o `cargarNuevaCertificacion()`.
*   `modulos/facturacion/` _(Futuro)_ ➔ Cuando integres cobros de suscripción mensual vía web, acá vivirán `PricingTable.tsx` y las conexiones directas con Stripe o MP.
*   `modulos/compartido/` ➔ Componentes que son de lógica de negocio o datos pero que los usan más de 1 módulo y no se pueden guardar en uno solo.
    *   `data/mockDB.ts` ➔ Entorno simulado temporal que emula la Base de Datos para probar la UI sin un backend real conectado.

### 3. La Capa Global de UI (`src/components`)

Cualquier cosa que pongas en esta carpeta **debe ser "Tonta" o "Agnóstica"**. Es decir: Si creás un componente acá, este componente visual no debe saber si lo que muestra en pantalla es una Empresa o un Proveedor... sólo sabe que tiene que mostrar texto y verse lindo.

*   `components/plantillas/` ➔ Estructuras gigantescas que agrupan a otros componentes (Layouts), pero que siguen siendo genéricos.
    *   `AppShell.tsx` ➔ La cascara superior que contiene la aplicación entera.
    *   `Header.tsx` ➔ La barra de navegación superior (Navbar).
*   `components/ui/` ➔ Componentes puros atómicos usando el estándar moderno de Tailwind (Shadcn UI).
    *   `button.tsx`, `card.tsx`, `badge.tsx` ➔ Código estándar reutilizable mil veces. Modificando un archivo de estos se modifica el estilo visual en toda tu app en segundos sin tocar código de negocio. No debes inyectar lógicas de perfiles en archivos de esta carpeta jamás, solo parámetros de estilos o clicks ciegos.

### 4. Soporte y Herrería (`src/lib` y `src/types`)

Carpetas de acompañamiento estructural necesarias para TypeScript y la modernidad de React:

*   `src/types/index.ts` ➔ Tipados estrictos y modelos (Schemas). Aquí se definen los "moldes". Por ejemplo: *¿Qué campos tiene obligatoriamente un Proveedor? Tiene que tener un nombre que es texto, un ID que es un número largo, etc.* 
*   `src/lib/` ➔ Herramientas utilitarias o conexiones crudas externas.
    *   `utils.ts` ➔ Funcioncitas utilitarias como "Unir estilos de Tailwind (cn)".

---

## 🛠️ Reglas Básicas para el Equipo

Si te preguntas **"¿Dónde pongo este código nuevo que quiero crear?"** seguí esta regla de 3 simples pasos:

1. ¿Es una página entera nueva que el usuario navega a través de una URL? ➔ Va en `src/app`.
2. ¿Es un bloque visual chiquitito (un botón, un modal de confirmación, un nuevo título)? ➔ Va en `src/components/ui`.
3. ¿Es un bloque grandote que tiene un proceso del sistema atado por atrás (Ej: Un formulario para que un Proveedor suba sus fotos, o un carrito de pagos en MercadoPago)? ➔ Va en `src/modulos/{nombre_del_modulo}`.

## 🚀 Próximos Pasos de Desarrollo (Roadmap)

1. **Configurar la Base de Datos Real:** Crear instancia de Prisma o Supabase para hacer el puente y borrar para siempre el archivo temporal `mockDB.ts`.
2. **Cierre de Autenticación:** Generar el sistema de tokens Real (con contraseñas) para reemplazar el Log in automático.
3. **Módulo de Suscripción ($):** Integrar SDK de MercadoPago / Stripe para cobrar canon mensual.

PREGUNTA QUE LE HICE A LA IA: el backend como se maneja? este encarpetado es el mas ordenado y mas eficaz en optimizacion y fluidez?


¡Sí! Esta arquitectura para manejar el Backend es la más óptima, ordenada y eficaz (en términos de carga y fluidez) que podés tener hoy en día usando el paradigma de Next.js App Router (React Server Components).

Te explico cómo funciona el backend acá y por qué está estructurado de esta manera para garantizar la máxima velocidad:

1. ¿Cómo se maneja el Backend en esta arquitectura?
Con Next.js moderno ya no necesitás tener un repositorio aparte para el backend (ej: otro proyecto en Node.js/Express corriendo en otro servidor). El backend vive dentro del mismo proyecto, pero se separa en dos lugares clave según su propósito:

A) Operaciones de lectura (Mostrar Datos Rápidos) ➔ "Server Components"
Las operaciones donde solo necesitas leer información de la base de datos (Ej: "Mostrar todas las empresas") se hacen directamente dentro del Modulo de Empresas o en el 

page.tsx
. Como todo corre en el servidor por defecto en el nuevo Next.js, esto significa que el HTML ya llega pre-armado y con los datos reales al celular del usuario en 0 milisegundos, sin tiempos de carga (Spinners). Fluidéz absoluta.

B) Operaciones de escritura (Guardar/Modificar) ➔ Carpetas actions/
Cuando un usuario cliquea "Crear Perfil" o "Pagar Suscripción", eso dispara una Server Action. Esto es, literal, una función que vive adentro de src/modulos/{nombre_del_modulo}/actions/. Estas carpetas actions son tu Backend. Ahí adentro haces el .save() a la base de datos de manera 100% segura (nunca se expone en el navegador). Next.js se encarga automáticamente de crear el puente (como si fuera una API oculta hiper-optimizada) sin que tengas que programar o lidiar con peticiones fetch() convencionales (que son más tortuosas y pesadas).

C) Endpoints Públicos o Webhooks Externos ➔ Carpeta src/app/api/
¿Cuándo usas la carpeta genérica api/ entonces? Únicamente cuando una computadora de afuera necesita hablar con tu sistema. Por ejemplo:

MercadoPago necesita avisarte que "Julián pagó el Plan Oro". Ellos no pueden hacer click en tu pantalla web, así que MercadoPago lanza una petición automática a tu-web.com/api/webhooks/mercadopago. Ahí es el único escenario donde construís endpoints clásicos (Rutas de API).
2. ¿Por qué es la más eficaz para la Escalabilidad y Fluidez?
Splitting de Código (Feature-Sliced Design): Al dividir el código por "Módulos" (Empresas, Proveedores, Pagos), cuando un usuario entra a ver el catálogo de empresas, el servidor de Vercel/Next.js sólo va a descargar y ejecutar el módulo de Empresas. No va a cargar nada relacionado a los Proveedores ni al módulo de Facturación ni al panel de Administrador. Esto hace que la página vuele de rápida a medida que el proyecto crece.
Micro-Backend encapsulado: En las arquitecturas viejas, la carpeta "actions" o "controllers" era gigante y tenía cientos de archivos mezclados. Acá, si mañana querés borrar el módulo de "Reseñas", literalmente vas y borrás la carpeta src/modulos/resenas/, y se borra la interfaz visual, el backend asociado, y los métodos de base de datos interconectados. Todo junto. A nivel empresarial, le da la paz mental al equipo de que tocar "A" no rompe "Z".
Es el patrón que utilizan equipos grandes porque acorta el "tiempo de viaje" (encontrar la línea de código donde falla el backend que guardó mal el registro de una empresa te tomará 1 segundo, porque vas directo a modulos/empresas/actions/guardar.ts).
