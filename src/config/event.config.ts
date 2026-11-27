/**
 * Configuración del evento — única fuente de verdad.
 *
 * Los valores marcados con PENDIENTE son marcadores de posición: nadie nos
 * dio ese dato todavía. No están inventados para rellenar, están señalados
 * para que se reemplacen. La interfaz sabe leer esas banderas y se comporta
 * distinto mientras no estén confirmados (ver `fecha.confirmada`).
 * Los marcados FICTICIO son contenido de ejemplo para reemplazar.
 *
 * No hay base de datos: todo el contenido sale de este archivo.
 */

export type ItemCronograma = {
  hora: string;
  titulo: string;
  descripcion?: string;
  icono: "anillos" | "copa" | "cena" | "musica" | "brindis" | "corazon";
};

export type FotoGaleria = {
  src: string | null;
  alt: string;
  caption?: string;
  /** Alto relativo dentro del mosaico. Rompe la cuadrícula perfecta. */
  peso?: 1 | 2 | 3;
};

/*
 * Cronograma y galería se declaran fuera del objeto porque `as const`
 * congelaría cada literal y los campos opcionales (descripcion, caption)
 * dejarían de existir en el tipo. Anotados así, siguen siendo editables
 * con todos sus campos disponibles.
 */
const cronograma: ItemCronograma[] = [
  { hora: "18:00", titulo: "Recepción", icono: "copa" },
  { hora: "18:30", titulo: "Ceremonia", icono: "anillos" },
  { hora: "20:00", titulo: "Cena", icono: "cena" },
  { hora: "21:30", titulo: "Celebración", icono: "brindis" },
  { hora: "23:00", titulo: "Fiesta", icono: "musica" },
];

/**
 * FICTICIO — fotos de relleno de Picsum (picsum.photos), no de Aaron y
 * Jasne. Semillas fijas para que cada una salga siempre igual mientras se
 * revisa el diseño. Reemplázalas por las reales antes de publicar: basta
 * con cambiar cada `src` por una ruta en `public/fotos/...`.
 */
const galeria: FotoGaleria[] = [
  { src: "https://picsum.photos/seed/aj-galeria-1/900/1200", alt: "Aaron y Jasne", peso: 2 },
  { src: "https://picsum.photos/seed/aj-galeria-2/900/900", alt: "Aaron y Jasne", peso: 1 },
  { src: "https://picsum.photos/seed/aj-galeria-3/900/1400", alt: "Aaron y Jasne", peso: 3 },
  { src: "https://picsum.photos/seed/aj-galeria-4/900/900", alt: "Aaron y Jasne", peso: 1 },
  { src: "https://picsum.photos/seed/aj-galeria-5/900/1200", alt: "Aaron y Jasne", peso: 2 },
  { src: "https://picsum.photos/seed/aj-galeria-6/900/900", alt: "Aaron y Jasne", peso: 1 },
];

export const evento = {
  pareja: {
    uno: "Aaron",
    dos: "Jasne",
    monograma: { a: "A", b: "J" },
  },

  fecha: {
    /**
     * PENDIENTE — día exacto sin confirmar. Enero 2027 es lo único cerrado.
     * La cuenta regresiva necesita un instante concreto, así que corre sobre
     * esta estimación y la interfaz lo dice abiertamente mientras
     * `confirmada` sea false. En cuanto sepas el día: cambia el ISO y pon
     * `confirmada: true`. Nada más hay que tocar.
     */
    iso: "2027-01-16T18:00:00-03:00",
    confirmada: false,
    /** Lo que se muestra cuando la fecha aún no está cerrada. */
    aproximada: "Enero 2027",
    /** Lo que se muestra una vez confirmada. */
    larga: "Sábado 16 de enero de 2027",
    corta: "16.01.27",
  },

  frase: "Dos historias que venían caminando solas y decidieron seguir juntas.",

  // FICTICIO — lugar de ejemplo. Cambia estos valores por los reales.
  lugar: {
    nombre: "Viña Los Alerces",
    direccion: "Camino a Melipilla Km 34",
    ciudad: "Melipilla, Región Metropolitana",
    /** URL de Google Maps para el botón "Abrir en Google Maps". */
    mapsUrl: "https://maps.google.com/?q=Melipilla+Region+Metropolitana",
    /**
     * Consulta de búsqueda para el mapa incrustado. Se usa el modo `place`
     * de Google Maps Embed, que no requiere clave de API.
     */
    consultaMapa: "Melipilla, Región Metropolitana, Chile",
    /**
     * Coordenadas en grados, solo como detalle tipográfico sobre el plano.
     * Déjalo vacío y no se dibuja. FICTICIO: son las de Melipilla, no las
     * de un recinto concreto.
     */
    coordenadas: "33°41′S · 71°13′O",
    /** FICTICIO — apuntes de logística. Lista vacía = no se muestra el bloque. */
    notas: [
      "45 minutos desde Santiago por la Ruta 78",
      "Estacionamiento dentro del recinto",
    ] as string[],
  },

  whatsapp: {
    /** Formato internacional sin +, espacios ni guiones. Ej: 56912345678 */
    numero: "56978829942",
    etiqueta: "Aaron & Jasne",
  },

  musica: {
    /** Archivo real en public/music/event-song.mp3. */
    src: "/music/event-song.mp3",
    titulo: "Perfect",
    artista: "Ed Sheeran",
  },

  // FICTICIO — historia de ejemplo para ver el diseño con texto real.
  historia: [
    {
      numero: "01",
      titulo: "El comienzo",
      texto:
        "Nos conocimos en la fila de un café que ninguno de los dos quería estar esperando. Diez minutos de conversación y ya habíamos perdido el interés en pedir algo para llevar.",
      anio: "2021",
    },
    {
      numero: "02",
      titulo: "Nuestro camino",
      texto:
        "Un departamento pequeño, un perro que llegó sin avisar y la costumbre de planear viajes que casi siempre terminábamos cambiando de ruta a mitad de camino.",
      anio: "2023",
    },
    {
      numero: "03",
      titulo: "Momentos que recordamos",
      texto:
        "En un mirador al que subimos por accidente, sin señal y sin plan, Aaron sacó del bolso algo que llevaba escondido hacía semanas.",
      anio: "2026",
    },
    {
      numero: "04",
      titulo: "El gran día",
      texto:
        "Y ahora queremos que esa misma gente que nos vio empezar esté ahí para vernos decir que sí, esta vez frente a todos.",
      anio: "2027",
    },
  ],

  cronograma,
  galeria,

  // FICTICIO — fotos de relleno de Picsum, no de Aaron y Jasne. Cámbialas
  // por rutas en public/fotos/ cuando tengan la sesión de fotos lista.
  fotos: {
    portada: "https://picsum.photos/seed/aj-portada/1600/2000",
    historia: [
      "https://picsum.photos/seed/aj-historia-1/1000/1250",
      "https://picsum.photos/seed/aj-historia-2/1000/1250",
      "https://picsum.photos/seed/aj-historia-3/1000/1000",
    ] as (string | null)[],
  },

  dressCode: {
    titulo: "Formal",
    // FICTICIO — texto de ejemplo.
    nota: "Traje oscuro y vestido largo o midi. Los jardines son de pasto, así que conviene pensarlo al elegir el taco.",
    reservado: "El blanco queda para Jasne.",
  },

  /** FICTICIO — fecha límite de ejemplo, ajústala junto con la fecha real. */
  rsvp: {
    cierreIso: "2026-12-01T23:59:00-03:00",
    cierreTexto: "1 de diciembre de 2026",
  },

  // FICTICIO — contactos de ejemplo con números inventados.
  contacto: [
    { nombre: "Camila (organización)", telefono: "+56 9 0000 0001" },
    { nombre: "Matías (padrino)", telefono: "+56 9 0000 0002" },
  ],
} as const;

export type Evento = typeof evento;

/** Un dato es marcador de posición si está vacío o empieza con PENDIENTE. */
export const pendiente = (v: string | null | undefined) =>
  !v || v.trim() === "" || v.trim().startsWith("PENDIENTE");

/** Texto de fecha correcto según esté confirmada o no. */
export const textoFecha = () =>
  evento.fecha.confirmada ? evento.fecha.larga : evento.fecha.aproximada;
