import { evento, textoFecha } from "@/config/event.config";

/**
 * Enlaces wa.me — el camino honesto mientras no exista WhatsApp Business API.
 *
 * Esto NO envía nada por sí solo: abre WhatsApp con el mensaje escrito y es
 * la persona quien pulsa enviar. Toda la interfaz está redactada en esos
 * términos ("abrir", "preparar"), nunca prometiendo un envío automático.
 *
 * Para migrar a la API oficial más adelante basta con reemplazar el cuerpo
 * de `enviar()` en el panel; las plantillas y variables ya viven separadas.
 */

export const hayWhatsapp = () => evento.whatsapp.numero.trim().length > 0;

const limpiar = (n: string) => n.replace(/[^\d]/g, "");

export function urlWhatsapp(texto: string, numero?: string) {
  const destino = limpiar(numero ?? evento.whatsapp.numero);
  const base = destino ? `https://wa.me/${destino}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(texto)}`;
}

/** Mensaje que el invitado manda a los novios tras confirmar en el sitio. */
export function mensajeConfirmacion(nombre: string, acompanantes: number) {
  const compania =
    acompanantes > 0
      ? `Voy con ${acompanantes} acompañante${acompanantes === 1 ? "" : "s"}.`
      : "Voy solo/a.";

  return [
    `Hola ${evento.pareja.uno} y ${evento.pareja.dos} 💍`,
    "",
    `Soy ${nombre} y quiero confirmar mi asistencia a su celebración de ${textoFecha().toLowerCase()}.`,
    compania,
    "",
    "¡Nos vemos! ❤️",
  ].join("\n");
}

/** Variables disponibles en las plantillas del panel. */
export type VariablesPlantilla = {
  nombre: string;
  acompanantes: number | string;
  fecha: string;
  lugar: string;
  hora: string;
};

/** Reemplaza {{variable}} por su valor. Las desconocidas quedan visibles. */
export function aplicarPlantilla(plantilla: string, vars: Partial<VariablesPlantilla>) {
  const tabla: Record<string, string> = {
    nombre: String(vars.nombre ?? ""),
    acompanantes: String(vars.acompanantes ?? 0),
    fecha: String(vars.fecha ?? textoFecha()),
    lugar: String(vars.lugar ?? evento.lugar.nombre ?? ""),
    hora: String(vars.hora ?? ""),
  };

  return plantilla.replace(/\{\{\s*(\w+)\s*\}\}/g, (completo, clave: string) =>
    clave in tabla ? tabla[clave] : completo,
  );
}
