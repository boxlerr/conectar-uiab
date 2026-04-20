import Link from "next/link";
import { ShieldCheck, FileText, Mail, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad | UIAB Conecta",
  description:
    "Política de privacidad y tratamiento de datos personales conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina.",
};

const secciones = [
  { id: "responsable", label: "Responsable del tratamiento" },
  { id: "datos", label: "Datos que recopilamos" },
  { id: "finalidad", label: "Finalidad del tratamiento" },
  { id: "base-legal", label: "Base legal" },
  { id: "conservacion", label: "Plazo de conservación" },
  { id: "cesion", label: "Cesión a terceros" },
  { id: "derechos", label: "Derechos del titular" },
  { id: "seguridad", label: "Medidas de seguridad" },
  { id: "cookies", label: "Cookies" },
  { id: "cambios", label: "Cambios en la política" },
  { id: "contacto", label: "Contacto" },
];

export default function PrivacidadPage() {
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
            <span className="text-slate-700">Privacidad</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Ley 25.326 · Protección de Datos Personales
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[0.95]"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Política de <br />
                <span className="text-primary/30">Privacidad</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Cómo tratamos tus datos personales en UIAB Conecta, con transparencia y de acuerdo a la normativa argentina vigente.
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
                  <FileText className="w-4 h-4 text-primary" />
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
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] font-semibold">
                  Documento legal
                </p>
                <p className="text-[13px] text-slate-700 font-medium">
                  Tratamiento de datos personales
                </p>
              </div>
            </div>

            <div
              className="legal-content max-w-none"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              <p>
                La presente Política de Privacidad describe los términos y condiciones bajo los cuales la{" "}
                <strong>Unión Industrial de Almirante Brown (UIAB)</strong>, a través de la plataforma{" "}
                <strong>UIAB Conecta</strong> (en adelante, &ldquo;la Plataforma&rdquo;), recolecta, almacena, utiliza
                y protege los datos personales de sus usuarios, en cumplimiento de la{" "}
                <strong>Ley N° 25.326 de Protección de los Datos Personales</strong>, su Decreto Reglamentario{" "}
                1558/2001 y las disposiciones de la Agencia de Acceso a la Información Pública (AAIP).
              </p>

              <h2 id="responsable">1. Responsable del tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos personales es la{" "}
                <strong>Unión Industrial de Almirante Brown</strong>, con domicilio en Luis María Drago 1951,
                Piso 2, Oficinas 14 y 15, Burzaco, Almirante Brown, Provincia de Buenos Aires (B1852LHA),
                República Argentina. Correo electrónico de contacto:{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a>.
              </p>

              <h2 id="datos">2. Datos que recopilamos</h2>
              <p>La Plataforma recopila las siguientes categorías de datos personales:</p>
              <ul>
                <li>
                  <strong>Datos de identificación:</strong> nombre, apellido, CUIT/CUIL, DNI, fecha de nacimiento.
                </li>
                <li>
                  <strong>Datos de contacto:</strong> correo electrónico, teléfono, domicilio comercial.
                </li>
                <li>
                  <strong>Datos de la empresa o actividad:</strong> razón social, rubro, productos y servicios ofrecidos.
                </li>
                <li>
                  <strong>Datos de navegación:</strong> dirección IP, tipo de navegador, páginas visitadas, cookies y tecnologías similares.
                </li>
                <li>
                  <strong>Datos de autenticación:</strong> credenciales cifradas para el acceso seguro a la Plataforma.
                </li>
              </ul>

              <h2 id="finalidad">3. Finalidad del tratamiento</h2>
              <p>Los datos personales serán utilizados para las siguientes finalidades:</p>
              <ul>
                <li>Registrar y autenticar a los usuarios dentro del directorio comercial.</li>
                <li>Facilitar la vinculación entre empresas, comercios, profesionales y oportunidades comerciales.</li>
                <li>Gestionar oportunidades, postulaciones y comunicaciones entre los miembros de la red.</li>
                <li>Enviar notificaciones, novedades institucionales y comunicaciones relacionadas con la actividad.</li>
                <li>Cumplir con obligaciones legales, regulatorias y de seguridad informática.</li>
                <li>Elaborar estadísticas internas anónimas para mejorar la experiencia de uso.</li>
              </ul>

              <h2 id="base-legal">4. Base legal del tratamiento</h2>
              <p>
                El tratamiento de los datos se realiza sobre la base del{" "}
                <strong>consentimiento libre, expreso e informado</strong> del titular (art. 5 de la Ley 25.326),
                así como en la ejecución de la relación institucional con la UIAB y el cumplimiento de
                obligaciones legales. El usuario podrá revocar su consentimiento en cualquier momento.
              </p>

              <h2 id="conservacion">5. Plazo de conservación</h2>
              <p>
                Los datos se conservarán mientras la cuenta del usuario se encuentre activa y durante los
                plazos legales aplicables para el cumplimiento de obligaciones derivadas de la relación.
                Una vez cumplidos dichos plazos, los datos serán bloqueados y posteriormente suprimidos,
                salvo que deban conservarse por mandato legal.
              </p>

              <h2 id="cesion">6. Cesión a terceros</h2>
              <p>
                La UIAB <strong>no cede, vende ni alquila</strong> datos personales a terceros. Los datos
                podrán ser compartidos únicamente con: (i) proveedores de servicios tecnológicos que actúan
                como encargados de tratamiento bajo obligación de confidencialidad (hosting, autenticación,
                envío de correos); (ii) autoridades públicas, cuando exista requerimiento legal debidamente
                fundado.
              </p>

              <h2 id="derechos">7. Derechos del titular de los datos</h2>
              <p>
                Conforme a los artículos 14, 15 y 16 de la Ley 25.326, el titular de los datos tiene derecho a:
              </p>
              <ul>
                <li>
                  <strong>Acceso:</strong> conocer si sus datos son tratados y obtener información al respecto.
                </li>
                <li>
                  <strong>Rectificación:</strong> solicitar la corrección de datos inexactos o incompletos.
                </li>
                <li>
                  <strong>Supresión:</strong> pedir la eliminación de sus datos cuando ya no sean necesarios.
                </li>
                <li>
                  <strong>Actualización:</strong> mantener los datos al día.
                </li>
                <li>
                  <strong>Oposición y retiro del consentimiento:</strong> oponerse a ciertos tratamientos
                  o revocar su consentimiento en cualquier momento.
                </li>
              </ul>
              <p>
                Estos derechos pueden ejercerse de forma gratuita enviando una solicitud a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a>, acreditando la
                identidad del solicitante.
              </p>
              <p className="text-[13px] text-slate-500 italic border-l-2 border-primary/30 pl-4">
                El titular de los datos tiene la facultad de ejercer el derecho de acceso de forma gratuita
                a intervalos no inferiores a seis meses, salvo que acredite un interés legítimo al efecto,
                conforme lo establecido en el artículo 14, inciso 3 de la Ley 25.326. La{" "}
                <strong>AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA</strong>, en su carácter de Órgano de
                Control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que
                interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas
                vigentes en materia de protección de datos personales.
              </p>

              <h2 id="seguridad">8. Medidas de seguridad</h2>
              <p>
                La Plataforma implementa medidas técnicas y organizativas razonables para proteger los datos
                personales contra pérdida, acceso no autorizado, alteración o divulgación. Entre ellas se
                incluyen: cifrado de contraseñas, conexiones seguras HTTPS, control de accesos por roles
                y auditorías periódicas de seguridad.
              </p>

              <h2 id="cookies">9. Cookies y tecnologías similares</h2>
              <p>
                La Plataforma utiliza cookies y tecnologías similares para el correcto funcionamiento,
                la autenticación de sesiones y el análisis de uso. Para más información, consultá nuestra{" "}
                <Link href="/cookies">Política de Cookies</Link>.
              </p>

              <h2 id="cambios">10. Cambios en la política</h2>
              <p>
                La UIAB podrá modificar la presente política para reflejar cambios legales, técnicos u
                operativos. La versión vigente será siempre publicada en esta página, indicando la fecha
                de última actualización. Se recomienda su revisión periódica.
              </p>

              <h2 id="contacto">11. Contacto</h2>
              <p>
                Para consultas sobre esta política o el tratamiento de tus datos podés escribirnos a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a> o acercarte a
                nuestras oficinas en Luis María Drago 1951, Burzaco, Almirante Brown.
              </p>
            </div>

            {/* Footer CTA */}
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <p className="text-[13px] text-slate-600">
                  ¿Dudas sobre tus datos?{" "}
                  <a
                    href="mailto:gerencia.ejecutiva@uiab.org"
                    className="text-primary font-medium hover:underline"
                  >
                    Escribinos
                  </a>
                </p>
              </div>
              <Link
                href="/cookies"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors group"
              >
                Ver Política de Cookies
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
