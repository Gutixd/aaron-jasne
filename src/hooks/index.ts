import { useEffect, useState } from "react";

/* ------------------------------------------------------ movimiento reducido */

export function useMovimientoReducido() {
  const [reducido, setReducido] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const aplicar = () => setReducido(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, []);

  return reducido;
}

/* ------------------------------------------------------------------ cuenta */

export type Restante = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  llego: boolean;
};

function calcular(objetivo: number): Restante {
  const delta = Math.max(0, objetivo - Date.now());
  const s = Math.floor(delta / 1000);
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
    llego: delta === 0,
  };
}

/**
 * Tiempo que falta. Se refresca cada minuto: la invitación solo muestra
 * los días, así que contar segundos sería trabajo (y batería) de más.
 */
export function useCuentaRegresiva(iso: string): Restante | null {
  const objetivo = new Date(iso).getTime();
  // null en el primer render: evita que el número salte al cargar.
  const [t, setT] = useState<Restante | null>(null);

  useEffect(() => {
    setT(calcular(objetivo));
    const id = window.setInterval(() => setT(calcular(objetivo)), 60_000);
    return () => window.clearInterval(id);
  }, [objetivo]);

  return t;
}
