import Link from "next/link";
import { Cookie, Settings2, ChevronRight, Mail } from "lucide-react";

export const metadata = {
  title: "Política de Cookies | UIAB Conecta",
  description:
    "Información sobre el uso de cookies y tecnologías similares en UIAB Conecta, conforme a la Ley 25.326 de Protección de los Datos Personales.",
};

const secciones = [
  { id: "que-son", label: "¿Qué son las cookies?" },
  { id: "tipos", label: "Tipos de cookies que usamos" },
  { id: "tercero", label: "Cookies de terceros" },
  { id: "gestion", label: "Cómo gestionarlas" },
  { id: "consentimiento", label: "Consentimiento" },
  { id: "cambios", label: "Cambios en la política" },
  { id: "contacto", label: "Contacto" },
];

const tiposCookies = [
  {
    nombre: "Esenciales",
    descripcion:
      "Necesarias para el funcionamiento de la Plataforma: autenticación, sesión, seguridad y preferencias básicas.",
    base: "Sin consentimiento previo",
    duracion: "Sesión / hasta 1 año",
  },
  {
    nombre: "Funcionales",
    descripcion:
      "Permiten recordar preferencias (idioma, vistas, filtros) para mejorar la experiencia de navegación.",
    base: "Consentimiento",
    duracion: "Hasta 1 año",
  },
  {
    nombre: "Analíticas",
    descripcion:
      "Nos ayudan a entender cómo se utiliza la Plataforma para mejorarla, mediante métricas agregadas y anonimizadas.",
    base: "Consentimiento",
    duracion: "Hasta 2 años",
  },
  {
    nombre: "Rendimiento",
    descripcion:
      "Monitorean la velocidad y estabilidad de la Plataforma para detectar errores y optimizar recursos.",
    base: "Consentimiento",
    duracion: "Hasta 1 año",
  },
];

export default function CookiesPage() {
  const fechaActualizacion = "20 de abril de 2026";

  return (
    <div className="min-h-screen bg-[#f7f9fb] selection:bg-primary/10">
      {/* Hero */}
      <section className="relative pt-12 md:pt-16 pb-16 md:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-6 tracking-[0.1em] uppercase">
            <Link href="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700">Cookies</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Transparencia · Ley 25.326
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[0.95]"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Política de <br />
                <span className="text-primary/30">Cookies</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Qué son, cómo las usamos y cómo podés gestionarlas desde tu navegador en todo momento.
              </p>
              <p className="text-[12px] text-slate-500 mt-4">
                Última actualización: {fechaActualizacion}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f2f4f6] -z-0 hidden lg:block" />
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* TOC */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24">
              <div className="bg-white border border-slate-200/70 rounded-xl p-5 shadow-sm shadow-primary/5">
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h3 className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.12em]">
                    Contenido
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {secciones.map((s, i) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="group flex items-start gap-2 text-[13px] text-slate-600 hover:text-primary transition-colors py-1"
                      >
                        <span className="text-[10px] text-slate-400 font-mono mt-1 w-4 flex-shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-snug">{s.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Body */}
          <article className="lg:col-span-9 bg-white border border-slate-200/70 rounded-xl p-8 md:p-12 shadow-sm shadow-primary/5">
            <div className="flex items-center gap-3 pb-6 mb-8 border-b border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] font-semibold">
                  Documento informativo
                </p>
                <p className="text-[13px] text-slate-700 font-medium">
                  Uso de cookies en UIAB Conecta
                </p>
              </div>
            </div>

            <div
              className="legal-content max-w-none"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              <p>
                En <strong>UIAB Conecta</strong> utilizamos cookies y tecnologías similares con el fin de
                garantizar el correcto funcionamiento de la Plataforma, mejorar la experiencia de uso y
                analizar de manera agregada cómo se utiliza el sitio. Esta política se rige por la{" "}
                <strong>Ley N° 25.326 de Protección de los Datos Personales</strong> y complementa nuestra{" "}
                <Link href="/privacidad">Política de Privacidad</Link>.
              </p>

              <h2 id="que-son">1. ¿Qué son las cookies?</h2>
              <p>
                Las cookies son pequeños archivos de texto que un sitio web almacena en tu dispositivo al
                visitarlo. Permiten recordar información sobre la navegación (como el inicio de sesión o
                tus preferencias) para facilitar el uso del sitio en visitas posteriores. También
                utilizamos tecnologías similares como <em>localStorage</em> y <em>sessionStorage</em>.
              </p>

              <h2 id="tipos">2. Tipos de cookies que usamos</h2>
              <p>
                A continuación se detallan las categorías de cookies utilizadas en UIAB Conecta:
              </p>
            </div>

            {/* Tabla de cookies */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/70">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-slate-50 border-b border-slate-200/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-[11px] uppercase tracking-[0.1em]">
                      Tipo
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-[11px] uppercase tracking-[0.1em]">
                      Descripción
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-[11px] uppercase tracking-[0.1em] hidden md:table-cell">
                      Base legal
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-[11px] uppercase tracking-[0.1em] hidden md:table-cell">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiposCookies.map((c) => (
                    <tr key={c.nombre} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold tracking-wide">
                          {c.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 leading-relaxed">{c.descripcion}</td>
                      <td className="px-4 py-4 text-slate-500 hidden md:table-cell whitespace-nowrap">
                        {c.base}
                      </td>
                      <td className="px-4 py-4 text-slate-500 hidden md:table-cell whitespace-nowrap">
                        {c.duracion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="legal-content max-w-none mt-8"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              <h2 id="tercero">3. Cookies de terceros</h2>
              <p>
                Podemos utilizar servicios de terceros (por ejemplo, proveedores de autenticación,
                alojamiento o analítica) que establecen sus propias cookies. Estos proveedores actúan como
                encargados de tratamiento bajo acuerdos de confidencialidad y cumplen con sus propias
                políticas de privacidad, a las cuales te recomendamos acceder.
              </p>

              <h2 id="gestion">4. Cómo gestionar las cookies</h2>
              <p>
                Podés aceptar, rechazar o eliminar las cookies en cualquier momento desde la configuración
                de tu navegador. Ten en cuenta que deshabilitar las cookies esenciales puede afectar el
                funcionamiento de la Plataforma, incluyendo el inicio de sesión y el acceso a secciones
                privadas.
              </p>
              <ul>
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gestionar cookies en Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gestionar cookies en Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/es-ar/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gestionar cookies en Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Gestionar cookies en Microsoft Edge
                  </a>
                </li>
              </ul>

              <h2 id="consentimiento">5. Consentimiento</h2>
              <p>
                Al continuar navegando por la Plataforma, aceptás el uso de cookies esenciales, las cuales
                son imprescindibles para su funcionamiento. Para el resto de categorías, tu consentimiento
                podrá obtenerse mediante mecanismos de aviso y podrás revocarlo en cualquier momento
                ajustando la configuración de tu navegador o escribiéndonos a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a>.
              </p>

              <h2 id="cambios">6. Cambios en la política</h2>
              <p>
                Podemos actualizar esta política cuando se introduzcan nuevas funcionalidades, servicios
                de terceros o modificaciones regulatorias. La versión vigente estará siempre disponible en
                esta página, indicando la fecha de última actualización.
              </p>

              <h2 id="contacto">7. Contacto</h2>
              <p>
                Para consultas sobre esta política podés escribirnos a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a>. Si querés
                conocer cómo tratamos tus datos personales en general, visitá nuestra{" "}
                <Link href="/privacidad">Política de Privacidad</Link>.
              </p>
            </div>

            {/* Footer CTA */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <p className="text-[13px] text-slate-600">
                  ¿Tenés consultas?{" "}
                  <a
                    href="mailto:gerencia.ejecutiva@uiab.org"
                    className="text-primary font-medium hover:underline"
                  >
                    Contactanos
                  </a>
                </p>
              </div>
              <Link
                href="/privacidad"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors group"
              >
                Ver Política de Privacidad
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
