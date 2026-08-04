import Link from "next/link";
import { Scale, FileText, Mail, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | UIAB Conecta",
  description:
    "Términos y condiciones de uso de UIAB Conecta, la plataforma de vinculación comercial B2B de la Unión Industrial de Almirante Brown.",
};

const secciones = [
  { id: "aceptacion", label: "Aceptación de los términos" },
  { id: "objeto", label: "Objeto de la Plataforma" },
  { id: "acceso", label: "Quiénes pueden acceder" },
  { id: "cuenta", label: "Cuenta y usuarios" },
  { id: "suscripcion", label: "Suscripción y pagos" },
  { id: "contenido", label: "Contenido publicado" },
  { id: "conducta", label: "Conducta prohibida" },
  { id: "resenas", label: "Reseñas y moderación" },
  { id: "responsabilidad", label: "Alcance de la responsabilidad" },
  { id: "propiedad", label: "Propiedad intelectual" },
  { id: "baja", label: "Suspensión y baja" },
  { id: "cambios", label: "Cambios en los términos" },
  { id: "ley", label: "Ley aplicable y jurisdicción" },
  { id: "contacto", label: "Contacto" },
];

export default function TerminosPage() {
  const fechaActualizacion = "4 de agosto de 2026";

  return (
    <div className="min-h-svh bg-[#f7f9fb] selection:bg-primary/10">
      {/* Hero */}
      <section className="relative pt-12 md:pt-16 pb-16 md:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-6 tracking-[0.1em] uppercase">
            <Link href="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700">Términos y Condiciones</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Condiciones de uso de la Plataforma
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[0.95]"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Términos y <br />
                <span className="text-primary/30">Condiciones</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Las reglas que ordenan el uso de UIAB Conecta: qué ofrece la Plataforma, qué esperamos de
                cada usuario y hasta dónde llega la responsabilidad de la UIAB.
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
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-[0.12em] font-semibold">
                  Documento legal
                </p>
                <p className="text-[13px] text-slate-700 font-medium">
                  Condiciones generales de uso
                </p>
              </div>
            </div>

            <div
              className="legal-content max-w-none"
              style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
            >
              <p>
                Los presentes Términos y Condiciones regulan el acceso y el uso de{" "}
                <strong>UIAB Conecta</strong> (en adelante, &ldquo;la Plataforma&rdquo;), el directorio y espacio
                de vinculación comercial B2B operado por la{" "}
                <strong>Unión Industrial de Almirante Brown (UIAB)</strong>, con domicilio en Luis María Drago
                1951, Piso 2, Oficinas 14 y 15, Burzaco, Almirante Brown, Provincia de Buenos Aires
                (B1852LHA), República Argentina.
              </p>

              <h2 id="aceptacion">1. Aceptación de los términos</h2>
              <p>
                Al registrarse, navegar o utilizar la Plataforma, el usuario declara haber leído, comprendido
                y aceptado estos Términos y Condiciones, junto con la{" "}
                <Link href="/privacidad">Política de Privacidad</Link> y la{" "}
                <Link href="/cookies">Política de Cookies</Link>, que forman parte integrante de este
                documento. Si no está de acuerdo con alguna de sus cláusulas, debe abstenerse de utilizar la
                Plataforma.
              </p>
              <p>
                Quien registra una empresa u organización declara contar con facultades suficientes para
                obligarla, y asume la responsabilidad por el uso que se haga de esa cuenta.
              </p>

              <h2 id="objeto">2. Objeto de la Plataforma</h2>
              <p>
                UIAB Conecta es un <strong>espacio de vinculación entre empresas</strong>. Su finalidad es
                dar visibilidad al entramado productivo de Almirante Brown y facilitar el contacto comercial
                entre sus integrantes. En particular, la Plataforma permite:
              </p>
              <ul>
                <li>Publicar y consultar fichas en un directorio industrial y de proveedores de servicios.</li>
                <li>Publicar necesidades y oportunidades comerciales, y postularse a las de terceros.</li>
                <li>Difundir productos, servicios, certificaciones y datos de contacto.</li>
                <li>Acceder a capacitaciones y eventos organizados por la UIAB y sus socias.</li>
              </ul>
              <p>
                La UIAB <strong>no interviene como parte ni garantiza</strong> las operaciones que las
                empresas acuerden entre sí. Ver la sección{" "}
                <a href="#responsabilidad">Alcance de la responsabilidad</a>.
              </p>

              <h2 id="acceso">3. Quiénes pueden acceder</h2>
              <p>
                Pueden registrarse personas jurídicas y personas humanas que desarrollen actividad económica
                registrada en la República Argentina. Se distinguen dos situaciones:
              </p>
              <ul>
                <li>
                  <strong>Socias de la UIAB:</strong> las empresas que integran el padrón de la entidad
                  acceden a la Plataforma <strong>sin cargo</strong>, como parte de su membresía. Su alta se
                  gestiona desde la sección &ldquo;Sumate&rdquo; y la habilita la UIAB.
                </li>
                <li>
                  <strong>Empresas y profesionales no socios:</strong> pueden registrarse y acceder mediante
                  la suscripción arancelada descripta en la sección{" "}
                  <a href="#suscripcion">Suscripción y pagos</a>.
                </li>
              </ul>
              <p>
                Toda alta queda sujeta a revisión y aprobación por parte de la UIAB, que podrá solicitar
                documentación respaldatoria y rechazar registros con datos inexactos, incompletos o que no
                correspondan a una actividad real.
              </p>
              <p>
                Si el CUIT informado ya corresponde a una ficha existente en la Plataforma,{" "}
                <strong>no se crea una ficha nueva</strong>: la cuenta se vincula a la ficha ya publicada y
                los datos cargados actualizan esa ficha. Esto evita duplicados en el directorio.
              </p>

              <h2 id="cuenta">4. Cuenta y usuarios</h2>
              <p>
                Cada organización administra una ficha y puede crear usuarios adicionales para las personas
                de su equipo (Compras, Mantenimiento, Administración y otras áreas). El titular de la cuenta
                es responsable de:
              </p>
              <ul>
                <li>La veracidad y actualización de los datos cargados.</li>
                <li>La confidencialidad de las credenciales de acceso, propias y de los usuarios que cree.</li>
                <li>Dar de baja los accesos de las personas que dejen de integrar la organización.</li>
                <li>Toda actividad realizada desde su cuenta y las de sus usuarios.</li>
              </ul>
              <p>
                Los usuarios creados por una organización acceden a la misma información y pueden editar la
                ficha. Ante cualquier uso no autorizado, el titular debe notificarlo de inmediato a la UIAB.
              </p>

              <h2 id="suscripcion">5. Suscripción y pagos</h2>
              <p>
                El acceso arancelado se instrumenta mediante una suscripción de <strong>precio único</strong>,
                sin escalonamiento por tamaño de empresa, en dos modalidades:
              </p>
              <ul>
                <li><strong>Mensual:</strong> $ 50.000 por mes.</li>
                <li><strong>Anual:</strong> $ 500.000 por año, abonado en un pago.</li>
              </ul>
              <p>
                Los pagos se procesan a través de <strong>Mercado Pago</strong>. La UIAB no almacena datos de
                tarjetas ni credenciales bancarias: esa información es tratada exclusivamente por el
                procesador de pagos conforme a sus propias condiciones.
              </p>
              <p>
                Los importes podrán actualizarse. Toda modificación será comunicada con una antelación
                razonable y regirá a partir del período siguiente, sin afectar períodos ya abonados. La falta
                de pago habilita a la UIAB a suspender el acceso a las funcionalidades aranceladas, sin que
                ello implique la eliminación de la información cargada.
              </p>
              <p>
                <strong>Las empresas socias de la UIAB no abonan suscripción</strong>: su acceso es de
                cortesía mientras mantengan su condición de socias.
              </p>

              <h2 id="contenido">6. Contenido publicado</h2>
              <p>
                Los textos, imágenes, logotipos, certificaciones, catálogos y demás materiales que cada
                usuario carga en la Plataforma son de su exclusiva autoría y responsabilidad. Al publicarlos,
                el usuario declara que cuenta con los derechos necesarios y otorga a la UIAB una licencia
                gratuita y no exclusiva para exhibirlos dentro de la Plataforma y en las comunicaciones
                institucionales vinculadas al directorio.
              </p>
              <p>
                La UIAB puede revisar, solicitar correcciones o despublicar contenido que resulte inexacto,
                engañoso, ofensivo, ilegal o ajeno a la finalidad de la Plataforma.
              </p>
              <p>
                Los certificados de normas cargados se utilizan únicamente para verificación interna: la
                Plataforma muestra la norma acreditada, no el archivo.
              </p>

              <h2 id="conducta">7. Conducta prohibida</h2>
              <p>Está prohibido, entre otras conductas:</p>
              <ul>
                <li>Registrar datos falsos, suplantar identidades o atribuirse la representación de terceros.</li>
                <li>Publicar contenido discriminatorio, difamatorio, engañoso o que infrinja derechos ajenos.</li>
                <li>Extraer masivamente los datos del directorio para armar bases de terceros o enviar spam.</li>
                <li>Interferir con el funcionamiento de la Plataforma o intentar accesos no autorizados.</li>
                <li>Usar la Plataforma con fines ajenos a la vinculación comercial entre empresas.</li>
              </ul>

              <h2 id="resenas">8. Reseñas y moderación</h2>
              <p>
                Las reseñas deben basarse en una experiencia comercial real y verificable. La UIAB modera las
                publicaciones antes de darles visibilidad y puede rechazar aquellas que sean ofensivas,
                anónimas de mala fe, manifiestamente falsas o que respondan a un conflicto ajeno a la
                operación comercial. La moderación no implica que la UIAB valide el contenido de la opinión.
              </p>

              <h2 id="responsabilidad">9. Alcance de la responsabilidad</h2>
              <p>
                La UIAB actúa como <strong>facilitadora del contacto</strong> entre empresas.{" "}
                <strong>No es parte de las operaciones comerciales</strong> que se acuerden a través de la
                Plataforma y no responde por el cumplimiento, la calidad, los plazos, los precios ni las
                condiciones pactadas entre las partes. Cada negociación, contratación y pago se celebra
                directamente entre las empresas involucradas, bajo su exclusiva responsabilidad.
              </p>
              <p>
                La información de las fichas es provista por cada organización: la UIAB no garantiza su
                exactitud ni su vigencia permanente. La Plataforma se ofrece en las condiciones en que se
                encuentra disponible, y la UIAB no garantiza su funcionamiento ininterrumpido ni libre de
                errores, aunque procura resolver a la brevedad cualquier incidencia que se le reporte.
              </p>

              <h2 id="propiedad">10. Propiedad intelectual</h2>
              <p>
                La marca UIAB Conecta, su identidad visual, el diseño de la Plataforma y su código fuente son
                propiedad de la Unión Industrial de Almirante Brown o de sus licenciantes. Su uso no
                autorizado está prohibido. Las marcas y logotipos de cada empresa registrada pertenecen a sus
                respectivos titulares.
              </p>

              <h2 id="baja">11. Suspensión y baja</h2>
              <p>
                El usuario puede solicitar la baja de su cuenta en cualquier momento escribiendo a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a>. La baja implica
                el retiro de la ficha del directorio; la conservación de los datos posterior a la baja se
                rige por lo previsto en la <Link href="/privacidad">Política de Privacidad</Link>.
              </p>
              <p>
                La UIAB podrá suspender o dar de baja cuentas que incumplan estos Términos, que registren
                falta de pago de la suscripción arancelada o cuya organización deje de reunir los requisitos
                de acceso, previa notificación cuando las circunstancias lo permitan.
              </p>

              <h2 id="cambios">12. Cambios en los términos</h2>
              <p>
                La UIAB puede actualizar estos Términos y Condiciones para reflejar cambios legales,
                funcionales o de servicio. La versión vigente es siempre la publicada en esta página, con su
                fecha de última actualización. El uso de la Plataforma con posterioridad a una modificación
                implica su aceptación.
              </p>

              <h2 id="ley">13. Ley aplicable y jurisdicción</h2>
              <p>
                Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Para cualquier
                controversia derivada de su interpretación o aplicación, las partes se someten a la
                jurisdicción de los <strong>tribunales ordinarios del Departamento Judicial de Lomas de
                Zamora, Provincia de Buenos Aires</strong>, con renuncia a cualquier otro fuero o
                jurisdicción que pudiera corresponder.
              </p>

              <h2 id="contacto">14. Contacto</h2>
              <p>
                Ante cualquier duda sobre estos Términos y Condiciones, podés escribir a{" "}
                <a href="mailto:gerencia.ejecutiva@uiab.org">gerencia.ejecutiva@uiab.org</a> o acercarte a
                Luis María Drago 1951, Piso 2, Oficinas 14 y 15, Burzaco, Almirante Brown, Provincia de
                Buenos Aires.
              </p>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <p className="text-[13px] text-slate-600">
                  ¿Dudas sobre estas condiciones?{" "}
                  <a
                    href="mailto:gerencia.ejecutiva@uiab.org"
                    className="text-primary font-medium hover:underline"
                  >
                    Escribinos
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
