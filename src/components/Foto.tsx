import { useState } from "react";

/**
 * Hueco de fotografía. Intenta cargar `src` (una ruta en public/fotos/); si
 * el archivo todavía no existe, muestra un espacio con el nombre exacto que
 * debe tener. Así las fotos se ponen soltando archivos en la carpeta, sin
 * tocar código.
 */
export default function Foto({
  src,
  alt,
  className = "",
  oscuro = false,
  prioridad = false,
  marco,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Hueco sobre fondo oliva: el marcador va en tonos claros. */
  oscuro?: boolean;
  prioridad?: boolean;
  /** Clases de un marco alrededor de la foto; si la foto falta, el marco tampoco aparece. */
  marco?: string;
}) {
  const [falla, setFalla] = useState(false);
  const archivo = src.split("/").pop();

  // En el sitio publicado, una foto que falta no deja un hueco con
  // instrucciones a la vista de los invitados: simplemente no aparece.
  if (falla && !import.meta.env.DEV) return null;

  const contenido = falla ? hueco() : (
    <img
      src={src}
      alt={alt}
      loading={prioridad ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFalla(true)}
      className={`object-cover ${className}`}
    />
  );
  return marco ? <div className={marco}>{contenido}</div> : contenido;

  function hueco() {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 border border-dashed text-center ${
          oscuro
            ? "border-papel/30 bg-oliva-hondo/40 text-papel/60"
            : "border-linea bg-[#e6e0d3] text-tinta-suave"
        } ${className}`}
        role="img"
        aria-label={`${alt} (foto pendiente)`}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M3 17 L9 12.5 L13 15.5 L16 13 L21 17" />
        </svg>
        <span className="rotulo text-[0.62rem]">Tu foto aquí</span>
        <span className="font-serif text-[0.8rem] italic opacity-80">fotos/{archivo}</span>
      </div>
    );
  }
}
