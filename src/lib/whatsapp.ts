import { evento, textoFecha } from "@/config/event.config";

/**
 * Enlaces wa.me: abren WhatsApp con el mensaje ya escrito y es la persona
 * quien pulsa enviar. Nada se envía solo, y la interfaz lo dice así.
 */

export const hayWhatsapp = () => evento.whatsapp.numero.trim().length > 0;

const limpiar = (n: string) => n.replace(/[^\d]/g, "");

export function urlWhatsapp(texto: string, numero?: string) {
  const destino = limpiar(numero ?? evento.whatsapp.numero);
  const base = destino ? `https://wa.me/${destino}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

/**
 * Respuesta completa del formulario, lista para enviar por WhatsApp.
 *
 * Sin base de datos, este mensaje ES el registro de la confirmación: lleva
 * todo lo que el invitado llenó, para que los novios no tengan que volver
 * a preguntar nada.
 */
export function mensajeConfirmacion(r: {
  nombre: string;
  asiste: boolean;
  acompanantes: number;
  telefono?: string;
  alimentacion?: string;
  mensaje?: string;
}) {
  const saludo = `Hola ${evento.pareja.uno} y ${evento.pareja.dos} 💍`;
  const fecha = textoFecha().toLowerCase();

  if (!r.asiste) {
    return [
      saludo,
      "",
      `Soy ${r.nombre}. Lamentablemente no podré acompañarlos en su celebración de ${fecha}.`,
      ...(r.mensaje ? ["", r.mensaje] : []),
      "",
      "Les mando todo mi cariño ❤️",
    ].join("\n");
  }

  const compania =
    r.acompanantes > 0
      ? `Voy con ${r.acompanantes} acompañante${r.acompanantes === 1 ? "" : "s"}.`
      : "Voy solo/a.";

  return [
    saludo,
    "",
    `Soy ${r.nombre} y confirmo mi asistencia a su celebración de ${fecha}.`,
    compania,
    ...(r.alimentacion ? [`Alimentación: ${r.alimentacion}`] : []),
    ...(r.telefono ? [`Mi teléfono: ${r.telefono}`] : []),
    ...(r.mensaje ? ["", r.mensaje] : []),
    "",
    "¡Nos vemos! ❤️",
  ].join("\n");
}
