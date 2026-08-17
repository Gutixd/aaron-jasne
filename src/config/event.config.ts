/**
 * Configuración del evento — única fuente de verdad.
 *
 * Los valores marcados con PENDIENTE son marcadores de posición: nadie nos
 * dio ese dato todavía. No están inventados para rellenar, están señalados
 * para que se reemplacen. La interfaz sabe leer esas banderas y se comporta
 * distinto mientras no estén confirmados (ver `fecha.confirmada`).
 *
 * Cuando el panel de administración guarda cambios, sobrescribe estos valores
 * en la tabla `settings`; este archivo queda como el respaldo con el que la
 * invitación arranca aunque la base no responda.
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
 * PENDIENTE — sin fotografías todavía. Con `src: null` cada hueco dibuja
 * una composición con el numeral y un rombo, no un rectángulo roto: la
 * maqueta se puede revisar y aprobar antes de la sesión de fotos.
 */
const galeria: FotoGaleria[] = [
  { src: null, alt: "Aaron y Jasne", peso: 2 },
  { src: null, alt: "Aaron y Jasne", peso: 1 },
  { src: null, alt: "Aaron y Jasne", peso: 3 },
  { src: null, alt: "Aaron y Jasne", peso: 1 },
  { src: null, alt: "Aaron y Jasne", peso: 2 },
  { src: null, alt: "Aaron y Jasne", peso: 1 },
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

  lugar: {
    // PENDIENTE — sin definir. Se muestran como "por confirmar" hasta que existan.
    nombre: "",
    direccion: "",
    ciudad: "",
    /** URL de Google Maps para el botón "Abrir en Google Maps". */
    mapsUrl: "",
    /**
     * Consulta de búsqueda para el mapa incrustado. Se usa el modo `place`
     * de Google Maps Embed, que no requiere clave de API.
     */
    consultaMapa: "",
  },

  /** PENDIENTE — número real de contacto para las confirmaciones. */
  whatsapp: {
    /** Formato internacional sin +, espacios ni guiones. Ej: 56912345678 */
    numero: "",
    etiqueta: "Aaron & Jasne",
  },

  musica: {
    /** Deja el archivo en public/music/ y apunta la ruta acá. */
    src: "/music/event-song.mp3",
    titulo: "",
    artista: "",
  },

  historia: [
    {
      numero: "01",
      titulo: "El comienzo",
      texto:
        "PENDIENTE — acá va cómo se conocieron, contado corto y en primera persona. Dos o tres frases bastan; lo que sobra le quita fuerza.",
      anio: "",
    },
    {
      numero: "02",
      titulo: "Nuestro camino",
      texto:
        "PENDIENTE — los años del medio. Un viaje, una mudanza, una costumbre que solo ellos entienden.",
      anio: "",
    },
    {
      numero: "03",
      titulo: "Momentos que recordamos",
      texto:
        "PENDIENTE — la propuesta, o el día que supieron. El detalle concreto vale más que el adjetivo.",
      anio: "",
    },
    {
      numero: "04",
      titulo: "El gran día",
      texto:
        "PENDIENTE — la invitación propiamente tal, dicha por ellos.",
      anio: "2027",
    },
  ],

  cronograma,
  galeria,

  fotos: {
    portada: null as string | null,
    historia: [null, null, null] as (string | null)[],
  },

  dressCode: {
    titulo: "Formal",
    nota: "PENDIENTE — indicación de vestuario.",
    reservado: "El blanco queda para Jasne.",
  },

  /** Cierre de confirmaciones. PENDIENTE de definir junto con la fecha. */
  rsvp: {
    cierreIso: "2026-12-01T23:59:00-03:00",
    cierreTexto: "1 de diciembre de 2026",
  },

  contacto: [] as { nombre: string; telefono: string }[],
} as const;

export type Evento = typeof evento;

/** Un dato es marcador de posición si está vacío o empieza con PENDIENTE. */
export const pendiente = (v: string | null | undefined) =>
  !v || v.trim() === "" || v.trim().startsWith("PENDIENTE");

/** Texto de fecha correcto según esté confirmada o no. */
export const textoFecha = () =>
  evento.fecha.confirmada ? evento.fecha.larga : evento.fecha.aproximada;
