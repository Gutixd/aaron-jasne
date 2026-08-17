import { useEffect, useRef, useState } from "react";

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

/* --------------------------------------------------------------- media query */

export function useMedia(consulta: string) {
  // Arranca en false para que el primer render sea estable y no salte.
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const aplicar = () => setCoincide(mq.matches);
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [consulta]);

  return coincide;
}

/** Escritorio con puntero fino: donde tienen sentido cursor propio y hover. */
export const useEsEscritorio = () => useMedia("(pointer: fine) and (min-width: 1024px)");

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

export function useCuentaRegresiva(iso: string): Restante | null {
  const objetivo = new Date(iso).getTime();
  // null en el primer render: evita que el número salte al hidratar.
  const [t, setT] = useState<Restante | null>(null);

  useEffect(() => {
    setT(calcular(objetivo));
    const id = window.setInterval(() => setT(calcular(objetivo)), 1000);
    return () => window.clearInterval(id);
  }, [objetivo]);

  return t;
}

/* ---------------------------------------------------------------- magnético */

/**
 * El elemento persigue suavemente al cursor cuando está cerca. Solo en
 * escritorio: en táctil no hay cursor que perseguir y además cuesta batería.
 */
export function useMagnetico<T extends HTMLElement>(fuerza = 0.32, radio = 90) {
  const ref = useRef<T>(null);
  const escritorio = useEsEscritorio();
  const reducido = useMovimientoReducido();

  useEffect(() => {
    const el = ref.current;
    if (!el || !escritorio || reducido) return;

    let frame = 0;

    const mover = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const c = el.getBoundingClientRect();
        const dx = e.clientX - (c.left + c.width / 2);
        const dy = e.clientY - (c.top + c.height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist < c.width / 2 + radio) {
          el.style.transform = `translate3d(${dx * fuerza}px, ${dy * fuerza}px, 0)`;
        } else {
          el.style.transform = "translate3d(0,0,0)";
        }
      });
    };

    const salir = () => {
      cancelAnimationFrame(frame);
      el.style.transform = "translate3d(0,0,0)";
    };

    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerleave", salir);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerleave", salir);
    };
  }, [fuerza, radio, escritorio, reducido]);

  return ref;
}
