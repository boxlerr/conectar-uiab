"use client";

import { useState } from "react";
import { useAuth } from "@/modulos/autenticacion/contexto-autenticacion";
import { Button } from "@/components/ui/button";
import { Star, MessageSquareQuote, Loader2, Info } from "lucide-react";
import { crearResena } from "./acciones-resenas";
import { toast } from "sonner";
import Link from "next/link";

interface FormularioResenaProps {
  targetType: "empresa" | "proveedor";
  targetId: string;
}

export function FormularioResena({ targetType, targetId }: FormularioResenaProps) {
  const { currentUser, isLoading } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-xl"></div>;
  }

  // 1. Must be logged in
  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
        <MessageSquareQuote className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-700 mb-2">Ingresá para dejar tu reseña</h4>
        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
          Para garantizar la fiabilidad de nuestro ecosistema, solo miembros autenticados de UIAB pueden opinar.
        </p>
        <Link href="/login">
          <Button className="bg-[#00213f] hover:bg-[#10375c] text-white font-bold text-xs uppercase tracking-widest px-6 shadow-md rounded-md">
            Iniciar Sesión
          </Button>
        </Link>
      </div>
    );
  }

  // 2. Must be a company or provider
  if (currentUser.role !== "company" && currentUser.role !== "provider") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex gap-3 text-amber-800 text-sm">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Solo las empresas y proveedores registrados pueden dejar reseñas públicas. (Tu rol actual es: {currentUser.role}).</p>
      </div>
    );
  }

  // 3. Prevent self-review (if the ID matched)
  if (currentUser.entityId === targetId) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 text-center text-sm text-slate-500 italic">
        "No puedes dejarte una reseña a ti mismo."
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-emerald-800 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <MessageSquareQuote className="w-6 h-6" />
        </div>
        <h4 className="font-bold mb-1">¡Gracias por tu opinión!</h4>
        <p className="text-sm opacity-90 max-w-xs mx-auto">
          Tu reseña fue enviada correctamente. Se encuentra en moderación y pronto será visible de forma pública.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor, selecciona una calificación (1 a 5 estrellas).");
      return;
    }
    if (!comentario.trim() || comentario.length < 10) {
      toast.error("Por favor, escribe un comentario descriptivo (mínimo 10 caracteres).");
      return;
    }

    setIsSubmitting(true);
    const res = await crearResena(
      targetType,
      targetId,
      currentUser.role as "company" | "provider",
      currentUser.entityId as string,
      { calificacion: rating, comentario }
    );
    setIsSubmitting(false);

    if (res.error) {
      toast.error("Hubo un error al enviar tu reseña.", { description: res.error });
    } else {
      toast.success("Reseña en moderación.");
      setHasSubmitted(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 sm:p-8">
      <h3 className="font-bold text-slate-900 text-lg mb-1">Calificá tu experiencia</h3>
      <p className="text-sm text-slate-500 mb-6">Tu valoración ayuda a otros industriales a tomar mejores decisiones comerciales.</p>

      {/* Estrellas Interactivas */}
      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="focus:outline-none transition-transform hover:scale-110"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                  : "text-slate-200 fill-slate-50"
              }`}
            />
          </button>
        ))}
        <span className="ml-3 text-sm font-semibold mt-2 text-slate-400">
          {rating > 0 && hoverRating === 0 ? `${rating} / 5` : ""}
        </span>
      </div>

      {/* Comentario */}
      <div className="space-y-2 mb-6">
        <label className="text-sm font-semibold text-slate-700">Tu opinión</label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Qué servicio contrataste? ¿Cómo fue el cumplimiento de plazos y calidad del trabajo?"
          className="w-full text-sm placeholder:text-slate-400 resize-none rounded-lg p-3 sm:p-4 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all h-28"
        />
        <div className="text-[11px] text-right font-medium text-slate-400">
          {comentario.length}/500
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#00182e] hover:bg-[#10375c] text-white font-bold h-12 uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar a Moderación"}
      </Button>
    </form>
  );
}
