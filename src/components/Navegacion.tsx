import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Rombo } from "./Marca";
import { evento } from "@/config/event.config";

const silk = [0.22, 1, 0.36, 1] as const;

const enlaces = [
  { id: "historia", texto: "Historia" },
  { id: "galeria", texto: "Galería" },
  { id: "dia", texto: "El día" },
  { id: "llegar", texto: "Cómo llegar" },
];

/**
 * Navegación flotante. No existe al principio: aparece recién cuando el
 * invitado dejó atrás la portada, para que la primera pantalla quede limpia.
 *
 * El principio de usabilidad del encargo manda sobre la estética: la acción
 * de confirmar está siempre a un toque, también en móvil, donde el resto de
 * los enlaces se ocultan pero "Confirmar" se queda.
 */
export default function Navegacion() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const revisar = (v: number) => setVisible(v > window.innerHeight * 0.85);
    revisar(scrollY.get());
    return scrollY.on("change", revisar);
  }, [scrollY]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -70, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -70, opacity: 0 }}
          transition={{ duration: 0.8, ease: silk }}
          className="fixed inset-x-0 top-0 z-[60] border-b border-tinta/8 bg-hueso/85 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3.5 sm:px-8">
            <a
              href="#portada"
              className="flex items-center gap-2 font-display text-lg leading-none text-tinta"
              aria-label="Ir arriba"
            >
              <span>{evento.pareja.monograma.a}</span>
              <span className="text-rosa">
                <Rombo tam={7} />
              </span>
              <span>{evento.pareja.monograma.b}</span>
            </a>

            <ul className="hidden items-center gap-9 md:flex">
              {enlaces.map((e) => (
                <li key={e.id}>
                  <a
                    href={`#${e.id}`}
                    className="eyebrow group relative text-[0.58rem] text-tinta-suave transition-colors hover:text-tinta"
                  >
                    {e.texto}
                    <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-rosa transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="#confirmar"
              className="eyebrow relative overflow-hidden border border-tinta/20 px-5 py-2.5 text-[0.55rem] text-tinta transition-colors duration-500 hover:border-rosa hover:text-hueso"
            >
              <span className="absolute inset-0 origin-left scale-x-0 bg-rosa transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-x-100 [a:hover>&]:scale-x-100" />
              <span className="relative">Confirmar</span>
            </a>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/** Filete de avance de lectura, pegado al borde superior. */
export function Progreso() {
  const { scrollYProgress } = useScroll();
  const opacidad = useTransform(scrollYProgress, [0, 0.015], [0, 1]);

  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-rosa"
      style={{ scaleX: scrollYProgress, opacity: opacidad }}
    />
  );
}
