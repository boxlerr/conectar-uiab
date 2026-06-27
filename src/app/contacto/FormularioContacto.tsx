"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enviarConsultaContacto, type ContactoInput } from "@/modulos/contacto/acciones";

const inputCls =
  "block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400";
const labelCls =
  "text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1";

const INICIAL = { nombre: "", apellido: "", email: "", asunto: "", mensaje: "", empresa_web: "" };

export function FormularioContacto() {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(INICIAL);
  const [enviado, setEnviado] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) return toast.error("Ingresá tu nombre.");
    if (!form.email.trim()) return toast.error("Ingresá tu email.");
    if (form.mensaje.trim().length < 5) return toast.error("Escribí un mensaje un poco más largo.");

    startTransition(async () => {
      const res = await enviarConsultaContacto(form as ContactoInput);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("¡Mensaje enviado! Te respondemos a la brevedad.");
      setEnviado(true);
    });
  }

  if (enviado) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h3
          className="text-xl font-bold text-[#00213f] mb-2 tracking-tight"
          style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
        >
          ¡Recibimos tu consulta!
        </h3>
        <p className="text-slate-600 max-w-sm mx-auto mb-6">
          Gracias por escribirnos. Nuestro equipo te va a responder a la brevedad a tu correo.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setForm(INICIAL);
            setEnviado(false);
          }}
        >
          Enviar otra consulta
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Honeypot anti-spam: oculto para humanos, tentador para bots */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.empresa_web}
        onChange={(e) => set("empresa_web", e.target.value)}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="nombre" className={labelCls}>Nombre</label>
          <input id="nombre" type="text" className={inputCls} placeholder="Escribe tu nombre"
            value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="apellido" className={labelCls}>Apellido</label>
          <input id="apellido" type="text" className={inputCls} placeholder="Escribe tu apellido"
            value={form.apellido} onChange={(e) => set("apellido", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className={labelCls}>Correo Electrónico</label>
        <input id="email" type="email" className={inputCls} placeholder="tucorreo@empresa.com"
          value={form.email} onChange={(e) => set("email", e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="asunto" className={labelCls}>Asunto</label>
        <input id="asunto" type="text" className={inputCls} placeholder="¿En qué podemos ayudarte?"
          value={form.asunto} onChange={(e) => set("asunto", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="mensaje" className={labelCls}>Mensaje</label>
        <textarea id="mensaje" rows={4} className={`${inputCls} resize-none`} placeholder="Describe tu consulta aquí..."
          value={form.mensaje} onChange={(e) => set("mensaje", e.target.value)} required />
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#00213f] hover:bg-[#10375c] text-white h-12 px-8 rounded text-[13px] uppercase tracking-widest font-bold transition-all hover:translate-y-[-2px] active:translate-y-[0px] shadow-none disabled:opacity-60 disabled:translate-y-0"
        >
          {isPending ? (
            <>Enviando <Loader2 className="w-3.5 h-3.5 ml-2.5 animate-spin" /></>
          ) : (
            <>Confirmar Envío <Send className="w-3.5 h-3.5 ml-2.5" /></>
          )}
        </Button>
      </div>
    </form>
  );
}
