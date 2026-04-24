import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export const metadata = {
  title: "Contacto | UIAB Conecta",
  description: "Ponte en contacto con la Unión Industrial de Almirante Brown",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] selection:bg-primary/10">
      {/* Header Section - Asymmetric and Editorial */}
      <section className="relative pt-12 md:pt-16 pb-20 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <span
                className="text-primary/60 font-semibold tracking-[0.2em] uppercase text-[10px] mb-3 block"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Conecta con nosotros
              </span>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black text-[#00213f] tracking-tighter leading-[0.95]"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Vías de <br />
                <span className="text-primary/30">Comunicación</span>
              </h1>
            </div>
            <div className="lg:col-span-4 pb-1">
              <p
                className="text-base md:text-lg text-slate-600 leading-relaxed font-medium"
                style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
              >
                Estamos aquí para potenciar tu crecimiento industrial. Envíanos un mensaje con la precisión que tu empresa merece.
              </p>
            </div>
          </div>
        </div>

        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#f2f4f6] -z-0 hidden lg:block" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 shadow-2xl shadow-primary/5 rounded-xl overflow-hidden bg-white">

          {/* Left Panel: Contact Info & Image Anchor */}
          <div className="lg:col-span-5 bg-[#00213f] text-white p-8 md:p-12 lg:p-14 relative overflow-hidden flex flex-col justify-between">
            {/* Background Texture/Image Anchor */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <Image
                src="/landing/hero-industrial.png"
                alt="Industrial Background"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#00213f] via-[#00213f]/90 to-transparent" />
            </div>

            <div className="relative z-10">
              <h3
                className="text-xl font-bold mb-10 tracking-tight"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Información Institucional
              </h3>

              <div className="space-y-8">
                <div className="group flex items-start gap-5">
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/20">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Ubicación</p>
                    <p className="text-white/90 text-sm leading-relaxed font-medium">
                      Luis María Drago 1951<br />
                      Piso 2 Of. 14 y 15<br />
                      Burzaco, Almirante Brown
                    </p>
                  </div>
                </div>

                <div className="group flex items-start gap-5">
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/20">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Teléfono</p>
                    <p className="text-white/90 text-sm font-medium">+54 11 3062-2001</p>
                  </div>
                </div>

                <div className="group flex items-start gap-5">
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white/20">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Email</p>
                    <p className="text-white/90 text-sm font-medium">gerencia.ejecutiva@uiab.org</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-12 border-t border-white/10 mt-12 lg:mt-0">
              <p className="text-white/30 text-[10px] font-mono leading-relaxed">
                UIAB CONECTA | {new Date().getFullYear()}<br />
                SISTEMA DE GESTIÓN INDUSTRIAL
              </p>
            </div>
          </div>

          {/* Right Panel: Form */}
          <div className="lg:col-span-7 bg-white p-8 md:p-12 lg:p-14">
            <h3
              className="text-xl font-bold text-[#00213f] mb-8 tracking-tight"
              style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
            >
              Envíanos una consulta
            </h3>

            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="first-name" className="text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    className="block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400"
                    placeholder="Escribe tu nombre"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last-name" className="text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    className="block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400"
                    placeholder="Escribe tu apellido"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400"
                  placeholder="tucorreo@empresa.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="subject" className="text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1">
                  Asunto
                </label>
                <input
                  type="text"
                  id="subject"
                  className="block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none placeholder:text-slate-400"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-[10px] font-bold text-primary/50 uppercase tracking-widest ml-1">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="block w-full bg-[#f2f4f6] text-[#00213f] rounded px-5 py-3 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium border-none resize-none placeholder:text-slate-400"
                  placeholder="Describe tu consulta aquí..."
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  className="bg-[#00213f] hover:bg-[#10375c] text-white h-12 px-8 rounded text-[13px] uppercase tracking-widest font-bold transition-all hover:translate-y-[-2px] active:translate-y-[0px] shadow-none"
                >
                  Confirmar Envío
                  <Send className="w-3.5 h-3.5 ml-2.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Technical Map Section */}
        <div className="mt-24 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px bg-primary/10 flex-grow" />
            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/40">Geolocalización Industrial</h4>
            <div className="h-px bg-primary/10 flex-grow" />
          </div>

          <div className="bg-[#f2f4f6] p-4 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700">
            <iframe
              src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=Luis%20Mar%C3%ADa%20Drago%201951,%20Burzaco,%20Buenos%20Aires+(Uni%C3%B3n%20Industrial%20de%20Almirante%20Brown)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-xl w-full mix-blend-multiply opacity-80"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
