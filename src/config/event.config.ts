/**
 * Configuración del evento — única fuente de verdad del contenido.
 *
 * Marcas:
 *   PENDIENTE — dato real que aún no se sabe. La interfaz dice "por confirmar".
 *   FICTICIO  — contenido de ejemplo para ver el diseño. Reemplazar antes de enviar.
 *
 * FOTOS: no hace falta tocar este archivo. Deja cada imagen en
 * `public/fotos/` con el nombre indicado y aparece sola. Mientras falte,
 * la invitación muestra un hueco con ese nombre.
 */

export type Icono =
  | "copas"
  | "anillos"
  | "arco"
  | "camara"
  | "cubiertos"
  | "torta"
  | "musica"
  | "destello";

export type ItemPrograma = {
  hora: string;
  titulo: string;
  /** Segunda línea opcional, como "& Brindis". */
  detalle?: string;
  icono: Icono;
};

/** FICTICIO — horarios de ejemplo. */
const programa: ItemPrograma[] = [
  { hora: "18:00", titulo: "Llegada", detalle: "de los invitados", icono: "copas" },
  { hora: "18:30", titulo: "Ceremonia", icono: "anillos" },
  { hora: "19:15", titulo: "Sesión de fotos", icono: "camara" },
  { hora: "20:00", titulo: "Cena", icono: "cubiertos" },
  { hora: "21:30", titulo: "Torta", detalle: "& Brindis", icono: "torta" },
  { hora: "22:00", titulo: "Fiesta", icono: "musica" },
  { hora: "02:00", titulo: "Fin de la noche", icono: "destello" },
];

/** Galería: public/fotos/galeria-1.jpg … galeria-4.jpg (agregar números para más fotos) */
const galeria = [1, 2, 3, 4].map((n) => ({
  src: `/fotos/galeria-${n}.jpg`,
  alt: `Aaron y Jasne ${n}`,
}));

export const evento = {
  pareja: {
    uno: "Aaron",
    dos: "Jasne",
    monograma: { a: "A", b: "J" },
  },

  fecha: {
    /**
     * PENDIENTE — día exacto sin confirmar; enero 2027 es lo único cerrado.
     * Con `confirmada: false` la invitación avisa que es una fecha estimada.
     * Cuando sepas el día: cambia el ISO y pon `confirmada: true`.
     */
    iso: "2027-01-16T18:00:00-03:00",
    confirmada: false,
    aproximada: "Enero 2027",
    larga: "Sábado 16 de enero de 2027",
    corta: "16.01.27",
  },

  textos: {
    encabezado: "Junto a sus familias",
    invitan: "te invitan a su",
    // FICTICIO — texto de ejemplo.
    anuncio:
      "Nos encantaría que nos acompañes en uno de los días más importantes de nuestras vidas y que lo celebres junto a nosotros.",
  },

  // FICTICIO — lugar de ejemplo.
  lugar: {
    nombre: "Viña Los Alerces",
    direccion: "Camino a Melipilla Km 34",
    ciudad: "Melipilla, Región Metropolitana",
    mapsUrl: "https://maps.google.com/?q=Melipilla+Region+Metropolitana",
  },

  whatsapp: {
    /** Formato internacional sin +, espacios ni guiones. */
    numero: "56978829942",
    etiqueta: "Aaron & Jasne",
  },

  musica: {
    src: "/music/event-song.mp3",
    titulo: "Perfect",
    artista: "Ed Sheeran",
  },

  programa,
  galeria,

  /** Nombres de archivo esperados en public/fotos/. */
  fotos: {
    /** Foto principal en arco (vertical, 3:4). */
    portada: "/fotos/portada.jpg",
    /** Fondo de la banda "Con amor" (horizontal). */
    conAmor: "/fotos/con-amor.jpg",
    /** El lugar (horizontal, 4:3). */
    lugar: "/fotos/lugar.jpg",
    /** Cierre "¡Gracias!" (vertical o cuadrada). */
    cierre: "/fotos/cierre.jpg",
    /**
     * Flores decorativas, PNG con fondo transparente. Si no están, se dibuja
     * una rama de hojas en su lugar.
     */
    floresArriba: "/fotos/flores-arriba.png",
    floresEsquina: "/fotos/flores-esquina.png",
  },

  vestimenta: {
    titulo: "Dress code",
    nota: "Formal. El blanco queda reservado para la novia.",
    /** Colores sugeridos, de claro a oscuro. */
    paleta: ["#f1ede4", "#a8ad95", "#6f7259", "#a89688", "#3d3f31"],
  },

  /**
   * FICTICIO — menú de ejemplo. `opciones` es una alternativa (ej.
   * vegetariana) que se muestra bajo el plato.
   */
  menu: {
    nota: "Si tienes alguna restricción alimentaria, cuéntanos al confirmar.",
    tiempos: [
      { tiempo: "Cóctel", plato: "Bocados fríos y calientes, espumante y jugos naturales" },
      { tiempo: "Entrada", plato: "Carpaccio de res con rúcula y parmesano", opciones: "Vegetariana: burrata con tomates asados" },
      { tiempo: "Fondo", plato: "Filete al vino tinto con papas rústicas", opciones: "Vegetariana: risotto de hongos" },
      { tiempo: "Postre", plato: "Torta de novios y mesa de dulces" },
      { tiempo: "Trasnoche", plato: "Completos y sándwiches para recargar energías" },
    ] as { tiempo: string; plato: string; opciones?: string }[],
  },

  // FICTICIO — texto de ejemplo.
  regalo:
    "Tu presencia es nuestro mejor regalo. Pero si quieres hacernos un obsequio, un aporte para nuestra luna de miel será recibido con mucho cariño.",

  cita: {
    texto:
      "Un matrimonio feliz es enamorarse muchas veces, siempre de la misma persona.",
    autor: "Mignon McLaughlin",
  },

  /**
   * FICTICIO — fecha límite de ejemplo. Pasada esta fecha el formulario se
   * cierra solo: nunca dejarla en el pasado mientras se mande la invitación.
   */
  rsvp: {
    cierreIso: "2027-01-02T23:59:00-03:00",
    cierreTexto: "2 de enero de 2027",
  },
} as const;

export type Evento = typeof evento;

/** Un dato es marcador de posición si está vacío o empieza con PENDIENTE. */
export const pendiente = (v: string | null | undefined) =>
  !v || v.trim() === "" || v.trim().startsWith("PENDIENTE");

/** Texto de fecha correcto según esté confirmada o no. */
export const textoFecha = () =>
  evento.fecha.confirmada ? evento.fecha.larga : evento.fecha.aproximada;
