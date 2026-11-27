import type { Icono } from "@/config/event.config";

/** Íconos de línea del programa, pensados para ir en blanco sobre oliva. */
export default function IconoPrograma({ nombre, tam = 26 }: { nombre: Icono; tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {trazos[nombre]}
    </svg>
  );
}

const trazos: Record<Icono, React.ReactNode> = {
  // Dos copas que brindan
  copas: (
    <>
      <path d="M6 5 L13 5 L12 13 C11.5 15.5 7.5 15.5 7 13 Z" transform="rotate(-12 9.5 10)" />
      <path d="M9.6 15.3 L10.6 24 M7.6 24.4 L13.4 23.6" transform="rotate(-12 9.5 10)" />
      <path d="M19 5 L26 5 L25 13 C24.5 15.5 20.5 15.5 20 13 Z" transform="rotate(12 22.5 10)" />
      <path d="M22.4 15.3 L21.4 24 M18.6 23.6 L24.4 24.4" transform="rotate(12 22.5 10)" />
      <path d="M15 4 L16 2 M17.5 4.5 L19 3 M12.5 4.5 L11 3" />
    </>
  ),
  // Dos anillos entrelazados
  anillos: (
    <>
      <circle cx="12" cy="18" r="7" />
      <circle cx="20" cy="18" r="7" />
      <path d="M17.5 7 L20 4 L22.5 7 L20 10 Z" />
    </>
  ),
  // Arco de ceremonia
  arco: (
    <>
      <path d="M7 28 L7 14 C7 8 11 4 16 4 C21 4 25 8 25 14 L25 28" />
      <path d="M10 28 L10 15 C10 10.5 12.8 7.5 16 7.5 C19.2 7.5 22 10.5 22 15 L22 28" />
      <path d="M4 28 L28 28" />
      <circle cx="16" cy="4" r="1.2" />
    </>
  ),
  camara: (
    <>
      <rect x="4" y="9" width="24" height="16" rx="3" />
      <path d="M11 9 L13 6 L19 6 L21 9" />
      <circle cx="16" cy="17" r="5" />
      <circle cx="16" cy="17" r="2.2" />
      <path d="M24 12.5 L24.5 12.5" />
    </>
  ),
  cubiertos: (
    <>
      <path d="M10 4 L10 11 C10 13 11.5 14 13 14 C14.5 14 16 13 16 11 L16 4 M13 4 L13 28" />
      <path d="M22 28 L22 4 C19 6 18.5 11 19 15 C19.3 16.5 20.5 17 22 17" />
    </>
  ),
  // Torta de tres pisos
  torta: (
    <>
      <path d="M6 28 L26 28 L26 21 L6 21 Z" />
      <path d="M9 21 L9 15 L23 15 L23 21" />
      <path d="M12 15 L12 10 L20 10 L20 15" />
      <path d="M16 10 L16 7 M14.8 5.2 C15.2 4 16.8 4 17.2 5.2 C17.5 6.2 16.5 7 16 7 C15.5 7 14.5 6.2 14.8 5.2" />
      <path d="M6 24.5 C9 23 11 26 14 24.5 C17 23 19 26 22 24.5 C24 23.5 25 24 26 24.5" />
    </>
  ),
  musica: (
    <>
      <path d="M12 23 L12 7 L26 4 L26 20" />
      <ellipse cx="9" cy="23" rx="3.4" ry="2.6" />
      <ellipse cx="23" cy="20" rx="3.4" ry="2.6" />
      <path d="M12 11 L26 8" />
    </>
  ),
  // Destello de fuegos artificiales: fin de la noche
  destello: (
    <>
      <path d="M16 4 L16 11 M16 21 L16 28 M4 16 L11 16 M21 16 L28 16" />
      <path d="M7.5 7.5 L12.4 12.4 M19.6 19.6 L24.5 24.5 M24.5 7.5 L19.6 12.4 M12.4 19.6 L7.5 24.5" />
      <circle cx="16" cy="16" r="1.6" />
    </>
  ),
};
