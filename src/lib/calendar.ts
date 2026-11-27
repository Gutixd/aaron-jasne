import { evento, pendiente } from "@/config/event.config";

const utc = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

/** RFC 5545: coma, punto y coma y barra invertida escapados en los textos. */
const esc = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

const inicio = () => new Date(evento.fecha.iso);
const fin = () => new Date(inicio().getTime() + 8 * 60 * 60 * 1000);

const titulo = () => `Matrimonio de ${evento.pareja.uno} y ${evento.pareja.dos}`;

// Sin nombre ni dirección escrita todavía, el link de Maps sirve de
// ubicación: el calendario lo muestra y se abre con un toque.
const ubicacion = () =>
  [evento.lugar.nombre, evento.lugar.direccion, evento.lugar.ciudad]
    .filter((v) => !pendiente(v))
    .join(", ") || evento.lugar.mapsUrl;

/**
 * Enlace a Google Calendar con el evento precargado. No pide iniciar sesión
 * ni clave de API: es la plantilla pública de creación de eventos, que es lo
 * correcto para una invitación abierta.
 */
export function urlGoogleCalendar() {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo(),
    dates: `${utc(inicio())}/${utc(fin())}`,
    details: evento.fecha.confirmada
      ? "¡Nos vemos ahí!"
      : "Fecha estimada — confirmaremos el día exacto.",
  });
  if (ubicacion()) p.set("location", ubicacion());
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Genera el .ics y dispara la descarga. Compatible con Apple, Outlook y Google. */
export function descargarIcs() {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//aaron-jasne//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:aaron-jasne-${utc(inicio())}@invitacion`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(inicio())}`,
    `DTEND:${utc(fin())}`,
    `SUMMARY:${esc(titulo())}`,
    ...(ubicacion() ? [`LOCATION:${esc(ubicacion())}`] : []),
    `DESCRIPTION:${esc(
      evento.fecha.confirmada
        ? `${evento.fecha.larga}. ¡Nos vemos ahí!`
        : "Fecha estimada — confirmaremos el día exacto.",
    )}`,
    // Dos avisos: una semana antes y el día anterior.
    "BEGIN:VALARM",
    "TRIGGER:-P7D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("Falta una semana para la boda")}`,
    "END:VALARM",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc("Mañana es la boda")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lineas.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${evento.pareja.uno}-y-${evento.pareja.dos}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}
