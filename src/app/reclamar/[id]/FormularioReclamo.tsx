"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Building2, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { llamarAccion } from "@/lib/accion-segura";
import { reclamarFicha } from "@/modulos/altas/acciones";
import { ayudaWhatsApp, CONSULTAS } from "@/lib/soporte";

// 16px fijo: por debajo de eso Safari iOS hace zoom al enfocar, y la mayoría de
// esta gente entra desde el celular.
const inputCls =
  "block w-full bg-[#f2f4f6] text-[#00213f] rounded-lg px-4 py-3 text-base outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/30 transition-all font-medium border border-transparent placeholder:text-slate-400";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

export function FormularioReclamo({
  empresaId,
  nombre,
  localidad,
  logoUrl,
}: {
  empresaId: string;
  nombre: string;
  localidad: string | null;
  logoUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [enviado, setEnviado] = useState(false);
  const [form, setForm] = useState({ referente_nombre: "", email: "", telefono: "" });
  /**
   * Los errores van EN EL CAMPO y se quedan ahí.
   *
   * No por toast: un aviso que se va solo a los pocos segundos no lo ve alguien
   * que está mirando el teclado del celular, y además incumple WCAG 2.2.1
   * (Timing Adjustable). Es el mismo criterio que /perfil/datos.
   */
  const [errores, setErrores] = useState<Record<string, string>>({});

  function set(campo: keyof typeof form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    // Una vez que el error apareció, se borra apenas la persona corrige.
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: "" }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nuevos: Record<string, string> = {};
    if (form.referente_nombre.trim().length < 2) {
      nuevos.referente_nombre = "Escribí tu nombre y apellido.";
    }
    // Validación propia y no `type="email"`: el cartel nativo del navegador tapa
    // la pantalla y bloquea el envío de todo el formulario (pasó en /perfil/datos).
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nuevos.email = "Revisá el correo: parece que falta algo.";
    }
    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos);
      // Al primer campo con error, para que no haya que buscarlo.
      const primero = ["referente_nombre", "email"].find((c) => nuevos[c]);
      if (primero) {
        const el = document.querySelector<HTMLInputElement>(`[name="${primero}"]`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    startTransition(async () => {
      const res = await llamarAccion(() => reclamarFicha({ ...form, empresa_id: empresaId }));
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if ("duplicado" in res && res.duplicado) {
        toast.info(res.mensaje ?? "Ya teníamos tu pedido.");
      }
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-primary/5 p-7 sm:p-10">
        <h1 className="text-2xl font-black text-[#00213f] tracking-tight mb-4">
          Recibimos tu pedido
        </h1>
        <div className="space-y-3 text-slate-600">
          <p>
            <span className="font-bold text-[#00213f]">Todavía no tenés cuenta.</span> Alguien de la
            UIAB va a confirmar que trabajás en {nombre} y te va a mandar un mail a{" "}
            <span className="font-semibold text-[#00213f]">{form.email.trim()}</span> para que
            elijas tu contraseña. Suele tardar hasta 3 días hábiles.
          </p>
          <p>
            Si no lo ves, fijate en <span className="font-semibold">Correo no deseado</span> o{" "}
            <span className="font-semibold">Promociones</span>.
          </p>
        </div>
        <a
          href={ayudaWhatsApp(CONSULTAS.altaDemorada)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white h-12 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          ¿Pasaron más de 3 días? Escribinos
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-xl shadow-primary/5 overflow-hidden">
      {/* La empresa, de entrada: es la prueba de que su ficha ya existe, que es
          todo el argumento de esta pantalla. */}
      <div className="flex items-center gap-4 bg-[#00213f] px-6 sm:px-9 py-6">
        {logoUrl ? (
          <div className="w-20 h-14 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src={logoUrl}
              alt={`Logo de ${nombre}`}
              width={160}
              height={112}
              className="w-full h-full object-contain p-1.5"
            />
          </div>
        ) : (
          <div className="w-20 h-14 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-white/70" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Ya está en el directorio
          </p>
          <p className="text-lg font-bold text-white leading-tight truncate">{nombre}</p>
          {localidad ? <p className="text-sm text-white/60">{localidad}</p> : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-9 space-y-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-black text-[#00213f] tracking-tight"
            style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
          >
            Pedí el acceso a esta ficha
          </h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            Su ficha está publicada en el directorio de la UIAB. Si trabajás acá, pedí el usuario
            para manejarla vos: cambiar los datos, subir el logo y contar a qué se dedican.
          </p>
        </div>

        <div>
          <label htmlFor="referente_nombre" className={labelCls}>
            Tu nombre y apellido <span className="text-rose-500">*</span>
          </label>
          <input
            id="referente_nombre"
            name="referente_nombre"
            className={inputCls}
            autoComplete="name"
            placeholder="Ej: Ana Gómez"
            value={form.referente_nombre}
            onChange={(e) => set("referente_nombre", e.target.value)}
            aria-invalid={Boolean(errores.referente_nombre)}
            aria-describedby={errores.referente_nombre ? "err-nombre" : undefined}
          />
          {errores.referente_nombre ? (
            <p id="err-nombre" role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {errores.referente_nombre}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className={labelCls}>
            Tu correo <span className="text-rose-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            className={inputCls}
            autoComplete="email"
            inputMode="email"
            placeholder="ana@empresa.com.ar"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errores.email)}
            aria-describedby={errores.email ? "err-email" : "ayuda-email"}
          />
          {errores.email ? (
            <p id="err-email" role="alert" className="mt-1.5 text-sm font-medium text-rose-600">
              {errores.email}
            </p>
          ) : (
            <p id="ayuda-email" className="mt-1.5 text-sm text-slate-500">
              Con este correo vas a entrar, y es el que va a figurar como contacto en la ficha.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="telefono" className={labelCls}>
            Teléfono o WhatsApp
          </label>
          <input
            id="telefono"
            name="telefono"
            className={inputCls}
            autoComplete="tel"
            inputMode="tel"
            placeholder="11 5555-5555"
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
          />
          <p className="mt-1.5 text-sm text-slate-500">
            Por si necesitamos ubicarte para confirmar. No se publica.
          </p>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-12 bg-[#00213f] hover:bg-[#10375c] text-white font-bold text-base rounded-lg"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" /> Pedir el acceso
            </>
          )}
        </Button>

        <p className="text-sm text-slate-500 leading-relaxed">
          Alguien de la UIAB confirma que trabajás en {nombre} y te manda un mail para que elijas tu
          contraseña. Si tu empresa es socia, no tiene ningún costo.
        </p>
      </form>
    </div>
  );
}
