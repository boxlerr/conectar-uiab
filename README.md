# Conectar UIAB - Directorio Industrial y Servicios SaaS

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
