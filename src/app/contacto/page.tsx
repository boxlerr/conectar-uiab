import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Contacto | Conectar UIAB",
  description: "Ponte en contacto con la Unión Industrial de Almirante Brown",
};

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Contacto
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos a la brevedad.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información de contacto */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Información</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Dirección</h4>
                    <p className="mt-1 text-slate-600">
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
                    <h4 className="font-semibold text-slate-900">Teléfono</h4>
                    <p className="mt-1 text-slate-600">+54 11 1234-5678</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0 text-primary-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Email</h4>
                    <p className="mt-1 text-slate-600">info@uiab.org</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium text-slate-700">Nombre</label>
                    <input
                      type="text"
                      id="first-name"
                      className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium text-slate-700">Apellido</label>
                    <input
                      type="text"
                      id="last-name"
                      className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                    placeholder="tucorreo@ejemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-700">Asunto</label>
                  <input
                    type="text"
                    id="subject"
                    className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                    placeholder="¿En qué te podemos ayudar?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700">Mensaje</label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm"
                    placeholder="Tu mensaje aquí..."
                  />
                </div>

                <div>
                  <Button type="button" className="w-full sm:w-auto gap-2">
                    <Send className="w-4 h-4" />
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
