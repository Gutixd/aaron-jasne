/**
 * Google Analytics 4, cargado solo si existe un ID configurado.
 *
 * Sin `VITE_GA_ID` no se inyecta ningún script ni se hace ninguna petición:
 * no queríamos que la invitación cargara un rastreador con un ID inventado.
 */

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let listo = false;

export function iniciarAnalytics() {
  if (!GA_ID || listo || typeof window === "undefined") return;
  listo = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as Gtag;
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });
}

/** Eventos que nos interesa medir en esta invitación en concreto. */
export type EventoMedido =
  | "entrar_experiencia"
  | "musica_play"
  | "musica_pause"
  | "rsvp_iniciado"
  | "rsvp_completado"
  | "rsvp_declinado"
  | "invitado_encontrado"
  | "invitado_no_encontrado"
  | "clic_whatsapp"
  | "clic_maps"
  | "clic_calendario"
  | "galeria_abierta"
  | "galeria_navegada";

export function medir(nombre: EventoMedido, datos?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", nombre, datos ?? {});
}
