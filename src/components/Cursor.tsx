import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEsEscritorio, useMovimientoReducido } from "@/hooks";

/**
 * Cursor propio para escritorio: un punto que sigue exacto y un aro que
 * llega tarde. Sobre cualquier cosa pulsable el aro crece y el punto se
 * disuelve — el aro pasa a ser el cursor.
 *
 * No se monta en táctil ni con movimiento reducido, y solo entonces se
 * esconde el cursor del sistema: si el componente no está, nadie se queda
 * sin puntero.
 */
export default function Cursor() {
  const escritorio = useEsEscritorio();
  const reducido = useMovimientoReducido();
  const activo = escritorio && !reducido;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const aroX = useSpring(x, { stiffness: 260, damping: 26, mass: 0.4 });
  const aroY = useSpring(y, { stiffness: 260, damping: 26, mass: 0.4 });

  const [sobrePulsable, setSobrePulsable] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!activo) return;
    document.documentElement.classList.add("cursor-oculto");
    return () => document.documentElement.classList.remove("cursor-oculto");
  }, [activo]);

  useEffect(() => {
    if (!activo) return;

    const mover = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);

      const el = e.target as Element | null;
      setSobrePulsable(
        !!el?.closest?.("a, button, input, textarea, select, [role='button'], label"),
      );
    };

    const salir = () => setVisible(false);

    window.addEventListener("pointermove", mover, { passive: true });
    document.addEventListener("pointerleave", salir);
    return () => {
      window.removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", salir);
    };
  }, [activo, x, y]);

  if (!activo) return null;

  return (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] block h-1 w-1 rounded-full bg-rosa mix-blend-difference"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: visible && !sobrePulsable ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] block rounded-full border border-rosa"
        style={{ x: aroX, y: aroY, translateX: "-50%", translateY: "-50%" }}
        animate={{
          width: sobrePulsable ? 44 : 26,
          height: sobrePulsable ? 44 : 26,
          opacity: visible ? (sobrePulsable ? 0.95 : 0.45) : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </>
  );
}
