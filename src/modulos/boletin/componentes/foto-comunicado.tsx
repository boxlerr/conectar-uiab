import Image from "next/image";

/**
 * La foto de un comunicado, ENTERA.
 *
 * Las fotos del boletín llegan en cualquier proporción (un flyer vertical, una
 * captura del celular, una foto apaisada de un evento) y con `object-cover` se
 * comían justo lo importante: el texto del flyer, las caras. Acá la foto va con
 * `object-contain` y el hueco que sobra se rellena con la misma foto ampliada y
 * desenfocada, así el recuadro nunca queda con bandas vacías.
 *
 * El padre define el tamaño (alto fijo o `aspect-*`); esto sólo lo llena.
 */
export function FotoComunicado({
  src,
  sizes,
  priority = false,
  className = "",
}: {
  src: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="64px"
        className="scale-110 object-cover opacity-60 blur-2xl"
      />
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
      />
    </div>
  );
}
