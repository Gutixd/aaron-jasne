import { useEffect, useState } from "react";

/** Lo que el servidor cuenta de un invitado (nunca su teléfono). */
export type Invitado = {
  nombre: string;
  cupos: number;
  codigo: string;
  previa: { asiste: boolean; personas: number } | null;
};

/** Código del link personal: …/?i=k7f3q9mx */
export function codigoDelLink(): string | null {
  if (typeof window === "undefined") return null;
  const c = new URLSearchParams(window.location.search).get("i")?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]{6,16}$/.test(c) ? c : null;
}

// Una sola consulta por visita, aunque varias secciones pregunten.
let pedido: Promise<Invitado | null> | null = null;

function pedirInvitado(): Promise<Invitado | null> {
  const codigo = codigoDelLink();
  if (!codigo) return Promise.resolve(null);
  pedido ??= fetch("/api/buscar.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo }),
  })
    .then((r) => r.json())
    .then((j: { encontrado?: boolean; invitado?: Invitado }) => (j?.encontrado && j.invitado ? j.invitado : null))
    .catch(() => null);
  return pedido;
}

/**
 * Invitado del link personal, o null si se abrió el link general (o el
 * código no existe). Mientras consulta también es null: la invitación se
 * ve completa desde el primer instante y el saludo aparece al llegar.
 */
export function useInvitadoDelLink(): Invitado | null {
  const [inv, setInv] = useState<Invitado | null>(null);
  useEffect(() => {
    let vivo = true;
    pedirInvitado().then((i) => vivo && setInv(i));
    return () => {
      vivo = false;
    };
  }, []);
  return inv;
}
