"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, Loader2, PartyPopper, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { enviarAltaSocio } from "@/modulos/altas/acciones";
import { CATEGORIAS_ALTA, type AltaSocioInput } from "@/modulos/altas/constantes";
import { LOCALIDADES_ALMIRANTE_BROWN } from "@/lib/datos/geografia-ar";

const ESTADO_INICIAL = {
  razon_social: "",
  nombre_comercial: "",
  cuit: "",
  actividad: "",
  categoria: "empresa_socia",
  ya_es_socio: false,
  referente_nombre: "",
  referente_cargo: "",
  email: "",
  telefono: "",
  sitio_web: "",
  localidad: "",
  direccion: "",
  mensaje: "",
};

const inputCls =
  "block w-full bg-[#f2f4f6] text-[#00213f] rounded px-4 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400";
const labelCls =
  "text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1 mb-1.5 block";

export function FormularioAlta() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [enviado, setEnviado] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.razon_social.trim()) return toast.error("Ingresá la razón social de tu empresa.");
    if (!form.referente_nombre.trim()) return toast.error("Ingresá el nombre del referente.");
    if (!form.email.trim()) return toast.error("Ingresá un email de contacto.");
    if (!form.ya_es_socio)
      return toast.error(
        "Este formulario es exclusivo para organizaciones socias de la UIAB. Si no sos socio, podés crear tu cuenta desde el registro."
      );
    if (!consentimiento)
      return toast.error("Necesitamos tu consentimiento para tratar los datos.");

    startTransition(async () => {
      const res = await enviarAltaSocio(form as AltaSocioInput);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if ("duplicado" in res && res.duplicado) {
        toast.info(res.mensaje ?? "Ya teníamos tu solicitud.");
      } else {
        toast.success("¡Datos enviados! Te vamos a contactar pronto.");
      }
      setEnviado(true);
      router.refresh(); // refresca el listado público
    });
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-xl shadow-2xl shadow-primary/5 p-10 md:p-14 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <PartyPopper className="w-8 h-8 text-emerald-600" />
        </div>
        <h3
          className="text-2xl font-bold text-[#00213f] mb-3 tracking-tight"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          ¡Listo, recibimos tus datos!
        </h3>
        <p className="text-slate-600 max-w-md mx-auto mb-8">
          El equipo de la Unión Industrial de Almirante Brown va a revisar la información y se va a
          comunicar con vos para activar el acceso de tu empresa a UIAB Conecta.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setForm(ESTADO_INICIAL);
              setConsentimiento(false);
              setEnviado(false);
            }}
          >
            Cargar otra empresa
          </Button>
          <Link href="/directorio">
            <Button className="bg-[#00213f] hover:bg-[#10375c] text-white w-full">
              Ver el directorio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-2xl shadow-primary/5 p-7 md:p-10 space-y-7"
    >
      {/* Aviso: alta exclusiva para socias UIAB */}
      <div className="flex items-start gap-3 bg-[#00213f]/[0.04] border border-[#00213f]/10 rounded-lg px-4 py-3.5">
        <ShieldCheck className="w-5 h-5 text-[#00213f] shrink-0 mt-0.5" />
        <p className="text-[13px] text-slate-600 leading-relaxed">
          <span className="font-bold text-[#00213f]">
            Este formulario es exclusivo para organizaciones socias de la UIAB.
          </span>{" "}
          Lo usamos para verificar tus datos contra el padrón y activar tu acceso a la
          plataforma. ¿No sos socio y querés ofrecer tus productos o servicios?{" "}
          <Link href="/register" className="text-primary font-semibold underline">
            Creá tu cuenta acá
          </Link>
          .
        </p>
      </div>

      {/* Datos de la empresa */}
      <fieldset className="space-y-5">
        <legend
          className="text-lg font-bold text-[#00213f] tracking-tight mb-1"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          Datos de la empresa
        </legend>

        <div>
          <label htmlFor="razon_social" className={labelCls}>
            Razón social <span className="text-rose-500">*</span>
          </label>
          <input
            id="razon_social"
            className={inputCls}
            placeholder="Ej. Metalúrgica del Sur S.A."
            value={form.razon_social}
            onChange={(e) => set("razon_social", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="nombre_comercial" className={labelCls}>
              Nombre comercial / Fantasía
            </label>
            <input
              id="nombre_comercial"
              className={inputCls}
              placeholder="Cómo te conocen"
              value={form.nombre_comercial}
              onChange={(e) => set("nombre_comercial", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cuit" className={labelCls}>
              CUIT
            </label>
            <input
              id="cuit"
              className={inputCls}
              placeholder="30-12345678-9"
              value={form.cuit}
              onChange={(e) => set("cuit", e.target.value)}
            />
            <p className="text-[11px] text-slate-400 mt-1.5 ml-1">
              Si ya sos socio, tu CUIT nos ayuda a encontrarte en el padrón de la UIAB.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="categoria" className={labelCls}>
            ¿Qué tipo de organización sos? <span className="text-rose-500">*</span>
          </label>
          <select
            id="categoria"
            className={inputCls}
            value={form.categoria}
            onChange={(e) => set("categoria", e.target.value)}
          >
            {CATEGORIAS_ALTA.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="actividad" className={labelCls}>
            Actividad / Rubro
          </label>
          <input
            id="actividad"
            className={inputCls}
            placeholder="Ej. Fabricación de autopartes"
            value={form.actividad}
            onChange={(e) => set("actividad", e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              checked={form.ya_es_socio}
              onChange={(e) => set("ya_es_socio", e.target.checked)}
            />
            <span>
              Confirmo que mi organización es socia de la UIAB{" "}
              <span className="text-rose-500">*</span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* Referente */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-100">
        <legend
          className="text-lg font-bold text-[#00213f] tracking-tight pt-5 mb-1"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          Persona de contacto
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="referente_nombre" className={labelCls}>
              Nombre y apellido <span className="text-rose-500">*</span>
            </label>
            <input
              id="referente_nombre"
              className={inputCls}
              placeholder="Quién maneja la cuenta"
              value={form.referente_nombre}
              onChange={(e) => set("referente_nombre", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="referente_cargo" className={labelCls}>
              Cargo
            </label>
            <input
              id="referente_cargo"
              className={inputCls}
              placeholder="Ej. Gerente comercial"
              value={form.referente_cargo}
              onChange={(e) => set("referente_cargo", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="email" className={labelCls}>
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={inputCls}
              placeholder="contacto@empresa.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="telefono" className={labelCls}>
              Teléfono / WhatsApp
            </label>
            <input
              id="telefono"
              className={inputCls}
              placeholder="+54 11 ..."
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      {/* Ubicación y extras */}
      <fieldset className="space-y-5 pt-2 border-t border-slate-100">
        <legend
          className="text-lg font-bold text-[#00213f] tracking-tight pt-5 mb-1"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          Ubicación y web
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="localidad" className={labelCls}>
              Localidad
            </label>
            <select
              id="localidad"
              className={inputCls}
              value={form.localidad}
              onChange={(e) => set("localidad", e.target.value)}
            >
              <option value="">Seleccioná una localidad…</option>
              {LOCALIDADES_ALMIRANTE_BROWN.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sitio_web" className={labelCls}>
              Sitio web
            </label>
            <input
              id="sitio_web"
              className={inputCls}
              placeholder="www.empresa.com"
              value={form.sitio_web}
              onChange={(e) => set("sitio_web", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="direccion" className={labelCls}>
            Dirección
          </label>
          <input
            id="direccion"
            className={inputCls}
            placeholder="Calle y número"
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="mensaje" className={labelCls}>
            Mensaje (opcional)
          </label>
          <textarea
            id="mensaje"
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="Contanos algo más sobre tu empresa o consultanos lo que necesites."
            value={form.mensaje}
            onChange={(e) => set("mensaje", e.target.value)}
          />
        </div>
      </fieldset>

      {/* Consentimiento + submit */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-start gap-3 text-xs text-slate-500 leading-relaxed cursor-pointer select-none pt-5">
          <input
            type="checkbox"
            className="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/30 shrink-0"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
          />
          <span>
            Autorizo a la UIAB a tratar estos datos para gestionar mi acceso a UIAB Conecta, de
            acuerdo a la{" "}
            <Link href="/privacidad" className="text-primary font-semibold underline" target="_blank">
              política de privacidad
            </Link>{" "}
            (Ley 25.326).
          </span>
        </label>

        <div className="flex items-center justify-between gap-4 mt-6">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Tus datos no se publican: sólo los ve el equipo de UIAB.
          </p>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#00213f] hover:bg-[#10375c] text-white h-12 px-8 rounded text-[13px] uppercase tracking-widest font-bold transition-all hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-60 disabled:translate-y-0"
          >
            {isPending ? (
              <>
                Enviando <Loader2 className="w-3.5 h-3.5 ml-2.5 animate-spin" />
              </>
            ) : (
              <>
                Enviar datos <Send className="w-3.5 h-3.5 ml-2.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
