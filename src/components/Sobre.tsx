import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Corazon, Divisor, Flores } from "./Ornamentos";
import { evento, textoFecha } from "@/config/event.config";

const suave = [0.22, 1, 0.36, 1] as const;

/**
 * Portada de entrada. Además de presentar, cumple una función: los
 * navegadores no dejan sonar música sin un toque del usuario, y este botón
 * es ese toque.
 *
 * Bloquea el scroll mientras está puesta, con un temporizador de respaldo:
 * si la animación de salida no terminara (pestaña en segundo plano), la
 * invitación igual queda libre.
 */
export default function Sobre({ onAbrir }: { onAbrir: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [visible, setVisible] = useState(true);
  const { pareja, fotos } = evento;

  useEffect(() => {
    if (!visible) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [visible]);

  useEffect(() => {
    if (!abierto) return;
    const id = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(id);
  }, [abierto]);

  if (!visible) return null;

  const abrir = () => {
    setAbierto(true);
    onAbrir();
  };

  return (
    <AnimatePresence onExitComplete={() => setVisible(false)}>
      {!abierto && (
        <motion.div
          key="sobre"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-oliva-hondo px-5"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: suave }}
        >
          <motion.div
            className="papel relative w-full max-w-[22rem] overflow-hidden px-7 pb-10 pt-12 text-center shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 1, ease: suave }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-3 border border-dorado/50" />
            <Flores src={fotos.floresEsquina} className="absolute -left-8 -top-6 w-28" />
            <Flores src={fotos.floresEsquina} className="absolute -bottom-6 -right-8 w-28 rotate-180" />

            <p className="rotulo text-[0.66rem] text-tinta-suave">Estás invitado a la boda de</p>
            <p className="titular mt-5 text-[2.6rem] text-oliva-hondo">{pareja.uno}</p>
            {/* pb: la cola de la "y" manuscrita baja mucho y tocaba la J. */}
            <p className="manuscrita pb-3 text-[2rem] leading-none text-oliva">y</p>
            <p className="titular text-[2.6rem] text-oliva-hondo">{pareja.dos}</p>
            <Divisor className="mt-4 text-oliva" ancho="3rem" />
            <p className="rotulo mt-4 text-[0.7rem] text-dorado">{textoFecha()}</p>

            {/* Sello de lacre oliva: es el botón. */}
            <motion.button
              type="button"
              onClick={abrir}
              aria-label="Abrir invitación"
              className="relative mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full text-papel-claro shadow-[0_8px_18px_-6px_rgba(40,42,30,0.75)]"
              style={{
                background: "radial-gradient(circle at 35% 30%, #6f7259 0%, #4a4d36 55%, #2f3123 100%)",
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: suave }}
              whileTap={{ scale: 0.92 }}
            >
              <span className="titular flex items-center gap-1 text-[1.35rem] text-dorado-claro">
                {pareja.monograma.a}
                <Corazon tam={7} />
                {pareja.monograma.b}
              </span>
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full border border-dorado-claro/60"
                animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            </motion.button>
            <p className="rotulo mt-4 text-[0.66rem] text-oliva">Toca para abrir</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
