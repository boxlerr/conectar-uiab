import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contacto | UIAB Conecta",
  description: "Ponte en contacto con la Unión Industrial de Almirante Brown",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb] pt-[60px] lg:pt-[64px] pb-10 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 
            className="text-3xl font-black text-[#00213f] tracking-tight sm:text-4xl lg:text-4xl"
            style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
          >
            Contacto
          </h1>
          <p 
            className="mt-2 text-sm lg:text-base text-slate-500 max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
          >
            Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos a la brevedad.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información de contacto */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 
                className="text-xl font-bold text-[#00213f] mb-6"
                style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
              >
                Información
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-[#00213f]"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      Dirección
                    </h4>
                    <p 
                      className="mt-1 text-slate-500 text-sm leading-relaxed"
                      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                    >
                      Luis María Drago 1951<br />
                      Piso 2 Of. 14 y 15<br />
                      Burzaco, Almirante Brown<br />
                      B1852LHA Buenos Aires<br />
                      Argentina
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-[#00213f]"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      Teléfono
                    </h4>
                    <p 
                      className="mt-1 text-slate-500 text-sm"
                      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                    >
                      +54 11 1234-5678
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-[#00213f]"
                      style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)" }}
                    >
                      Email
                    </h4>
                    <p 
                      className="mt-1 text-slate-500 text-sm"
                      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                    >
                      info@uiab.org
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label 
                      htmlFor="first-name" 
                      className="block text-sm font-bold text-slate-700 mb-2"
                      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                    >
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="first-name"
                      className="block w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-600 sm:text-sm border transition-all"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="last-name" 
                      className="block text-sm font-bold text-slate-700 mb-2"
                      style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                    >
                      Apellido
                    </label>
                    <input
                      type="text"
                      id="last-name"
                      className="block w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-600 sm:text-sm border transition-all"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-bold text-slate-700 mb-2"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="block w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-600 sm:text-sm border transition-all"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="subject" 
                    className="block text-sm font-bold text-slate-700 mb-2"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                  >
                    Asunto
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="block w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-600 sm:text-sm border transition-all"
                    placeholder="¿En qué te podemos ayudar?"
                  />
                </div>

                <div>
                  <label 
                    htmlFor="message" 
                    className="block text-sm font-bold text-slate-700 mb-2"
                    style={{ fontFamily: "var(--font-inter, 'Inter', sans-serif)" }}
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="block w-full rounded-lg border-slate-200 py-3 px-4 text-slate-900 shadow-sm focus:ring-2 focus:ring-primary-600 sm:text-sm border transition-all"
                    placeholder="Tu mensaje aquí..."
                  />
                </div>

                <div className="pt-2">
                  <Button type="button" className="w-full sm:w-auto h-12 px-8 rounded-lg font-bold shadow-lg shadow-primary-500/20">
                    <Send className="w-4 h-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="mt-16">
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <iframe 
              src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=es&amp;q=Luis%20Mar%C3%ADa%20Drago%201951,%20Burzaco,%20Buenos%20Aires+(Uni%C3%B3n%20Industrial%20de%20Almirante%20Brown)&amp;t=&amp;z=15&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" 
              width="100%" 
              height="400" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="rounded-xl w-full"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
