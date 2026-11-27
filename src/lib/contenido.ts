import { evento } from "@/config/event.config";

/**
 * Contenido editable desde el panel (fecha, lugar, programa, menú, regalo…).
 * Se pide una vez, antes de dibujar la invitación, y se aplica sobre
 * `evento`. Si el servidor tarda o falla, la invitación sale con lo que trae
 * el código: nunca queda en blanco por esto.
 */

type Contenido = {
  fecha?: { iso?: string; confirmada?: boolean };
  textos?: { anuncio?: string };
  lugar?: { nombre?: string; direccion?: string; ciudad?: string; mapsUrl?: string };
  whatsapp?: { numero?: string };
  programa?: { hora: string; titulo: string; detalle?: string; icono: string }[];
  menu?: { nota?: string; tiempos?: { tiempo: string; plato: string; opciones?: string }[] };
  vestimenta?: { nota?: string };
  regalo?: { texto?: string; transferencia?: Record<string, string> };
  rsvp?: { cierreIso?: string };
};

const ESPERA_MAX_MS = 1500;

// "Sábado 16 de enero de 2027", "16.01.27", "Enero 2027" — en hora de Chile.
const formato = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", ...o }).format(new Date(iso));
const mayuscula = (s: string) => s.charAt(0).toLocaleUpperCase("es-CL") + s.slice(1);

function aplicar(c: Contenido) {
  // `evento` es "as const" para el editor; aquí se actualiza una sola vez,
  // antes del primer dibujo, así que ningún componente ve el cambio a medias.
  const e = evento as unknown as Record<string, Record<string, unknown> & unknown[]>;
  const mezclar = (clave: string, valor: object | undefined) => {
    if (valor && typeof valor === "object") Object.assign(e[clave], valor);
  };

  if (c.fecha?.iso && !Number.isNaN(Date.parse(c.fecha.iso))) {
    const iso = c.fecha.iso;
    mezclar("fecha", {
      iso,
      confirmada: !!c.fecha.confirmada,
      larga: mayuscula(formato(iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).replace(",", "")),
      corta: formato(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/-/g, "."),
      aproximada: mayuscula(formato(iso, { month: "long", year: "numeric" }).replace(" de ", " ")),
    });
  }
  mezclar("textos", c.textos);
  mezclar("lugar", c.lugar);
  mezclar("whatsapp", c.whatsapp);
  mezclar("vestimenta", c.vestimenta);
  if (Array.isArray(c.programa)) e.programa.splice(0, e.programa.length, ...c.programa);
  if (c.menu) {
    if (c.menu.nota !== undefined) e.menu.nota = c.menu.nota;
    if (Array.isArray(c.menu.tiempos)) e.menu.tiempos = c.menu.tiempos;
  }
  if (c.regalo) {
    if (c.regalo.texto !== undefined) e.regalo.texto = c.regalo.texto;
    if (c.regalo.transferencia) Object.assign(e.regalo.transferencia as object, c.regalo.transferencia);
  }
  if (c.rsvp?.cierreIso && !Number.isNaN(Date.parse(c.rsvp.cierreIso))) {
    mezclar("rsvp", {
      cierreIso: c.rsvp.cierreIso,
      cierreTexto: formato(c.rsvp.cierreIso, { day: "numeric", month: "long", year: "numeric" }),
    });
  }
}

export async function cargarContenido(): Promise<void> {
  const control = new AbortController();
  const corte = window.setTimeout(() => control.abort(), ESPERA_MAX_MS);
  try {
    // "no-cache": siempre pregunta al servidor si cambió (si no, responde 304
    // sin contenido), así un cambio del panel nunca queda tapado por una
    // copia vieja guardada en el celular.
    const r = await fetch("/api/contenido.php", { signal: control.signal, cache: "no-cache" });
    const j = (await r.json()) as { ok?: boolean; contenido?: Contenido };
    if (r.ok && j.ok && j.contenido) aplicar(j.contenido);
  } catch {
    // Sin servidor o muy lento: se queda el contenido del código.
  } finally {
    window.clearTimeout(corte);
  }
}
