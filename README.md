# Conectar UIAB - Directorio Industrial y Servicios SaaS

Plataforma escalable construida sobre **Next.js 14+ (App Router)** utilizando la arquitectura de software **Feature-Sliced Design (Diseño Orientado a Módulos/Características)** para mantener el código organizado, predecible y altamente mantenible a medida que el sistema escala (suscripciones, pasarelas de pago, perfiles de proveedor, paneles de administrador, etc).

## 📂 Arquitectura de Carpetas

A diferencia de una arquitectura tradicional donde se mezclan 300 componentes en una misma carpeta `components`, este proyecto agrupa el código dependiendo de *qué dominio de la aplicación* resuelve. Esto evita el "código espagueti".

```text
src/
├── app/                  # ENRUTAMIENTO (URLs de la plataforma)
│   ├── (panel)/          # Layout de Dashboard, Rutas protegidas (próximamente middleware)
│   │   ├── admin/        # Panel para el Super Admin
│   │   ├── empresa/      # Panel para Empresas (buscar proveedores, reseñas)
│   │   └── proveedor/    # Panel para Proveedores (perfil, analíticas)
│   ├── api/              # Endpoints del Backend (webhooks de Stripe/MercadoPago)
│   └── globals.css       # Estilos globales y variables de Tailwind
│
├── modulos/              # 🔥 EL CORAZÓN DEL SISTEMA: Lógica agrupada por Dominio
│   ├── empresas/         # Todo lo exclusivo a las Empresas
│   │   ├── components/   # Ej: CompanyCard.tsx
│   │   └── acciones.ts   # Server Actions para Empresas (Ej: publicarOferta)
│   ├── proveedores/      # Todo lo exclusivo a los Proveedores
│   │   ├── components/   # Ej: ProviderCard.tsx
│   ├── autenticacion/    # Manejo de Sesiones, Login, Roles
│   │   ├── components/   # Ej: AuthModal.tsx
│   │   └── AuthContext   # Estado global del usuario actual
│   ├── facturacion/      # Suscripciones y Pagos (A futuro)
│   └── compartido/       # Lógica de dominio compartida entre varios módulos (Ej: MockDB)
│
├── components/           # 📦 COMPONENTES GLOBALES O AGNOSTICOS
│   ├── plantillas/       # Estructuras maestras (Sidebar, AppShell, Header)
│   └── ui/               # Botones, Tarjetas, Inputs base (Ej: Shadcn UI)
│
├── types/                # Tipos e interfaces globales compartidas de TypeScript
└── lib/                  # Configuraciones base o utilitarios (Supabase, Utils)
```

## 🛠️ ¿Por qué esta estructura?

1. **Separación de Responsabilidades:** Si el día de mañana queremos añadir "Facturas en PDF" al sistema de suscripciones, simplemente creamos la carpeta `src/modulos/facturacion/ponents/Factura.tsx`. Esto evita ensuciar las lógicas de `empresas` o `proveedores`.
2. **Componentes Puros vs Impuros:** Todo lo que viva en `components/ui` no tiene idea de qué es una "Empresa" o un "Proveedor", sólo sabe renderizar un botón. Todo el código de negocio vive en `modulos/`.
3. **Escalado infinito:** Las rutas bajo `(panel)` pueden estar gobernadas por un mismo `middleware.ts` en el futuro, bloqueando el acceso a usuarios que no hayan pagado su suscripción mensual sin tener que validar en cada componente individualmente.

## 🚀 Próximos Pasos (Hoja de Ruta)

- [ ] **Base de datos real:** Reemplazar `modulos/compartido/data/mockDB.ts` con llamados a base de datos (Prisma, Drizzle, o Supabase).
- [ ] **Suscripciones de Pago:** Integrar pasarela de pago (MercadoPago/Stripe) dentro de un nuevo módulo `modulos/facturacion`.
- [ ] **Paneles Individuales:** Crear los sidebars específicos dentro del `(panel)` dependiendo del Rol que tenga el usuario en el `AuthContext`.
