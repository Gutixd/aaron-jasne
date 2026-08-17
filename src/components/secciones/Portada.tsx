import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Rombo } from "../Marca";
import { evento, textoFecha } from "@/config/event.config";
import { useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Portada. Composición deliberadamente descentrada: los nombres se apoyan
 * en el borde izquierdo y se salen un poco del margen, la fecha corre en
 * vertical por el canto derecho. Nada está centrado — el centro perfecto es
 * lo que hace que una portada parezca una plantilla.
 */
export default function Portada() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const reducido = useMovimientoReducido();

  const fondoY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const fondoEscala = useTransform(scrollYProgress, [0, 1], [1, 1.14]);
  const textoY = useTransform(scrollYProgress, [0, 1], ["0%", "-38%"]);
  const textoOpacidad = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      id="portada"
      ref={ref}
      className="relative flex h-[100svh] w-full items-end overflow-hidden bg-noche text-hueso"
    >
      <motion.div style={{ y: fondoY, scale: fondoEscala }} className="absolute inset-0">
        {evento.fotos.portada ? (
          <img
            src={evento.fotos.portada}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_25%_20%,#242a33_0%,#161a21_45%,#0b0d11_100%)]" />
        )}
        {/* Degradado bajo el texto: garantiza contraste cuando haya foto. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,17,0.92)_0%,rgba(11,13,17,0.45)_38%,rgba(11,13,17,0.18)_70%,rgba(11,13,17,0.5)_100%)]" />
      </motion.div>

      {/* Fecha en vertical por el canto derecho. */}
      <motion.div
        className="absolute right-5 top-1/2 hidden -translate-y-1/2 sm:block"
        style={{ opacity: textoOpacidad }}
        initial={{ opacity: 0, y: "-40%" }}
        animate={{ opacity: 1, y: "-50%" }}
        transition={{ duration: 1.4, delay: 0.9, ease: silk }}
      >
        <p
          className="eyebrow text-[0.58rem] text-hueso/45"
          style={{ writingMode: "vertical-rl" }}
        >
          {textoFecha()}
          {!evento.fecha.confirmada && " · fecha por confirmar"}
        </p>
      </motion.div>

      <motion.div
        style={{ y: textoY, opacity: textoOpacidad }}
        className="relative z-10 w-full px-6 pb-20 sm:px-12 sm:pb-24"
      >
        <motion.span
          className="eyebrow mb-6 flex items-center gap-3 text-[0.58rem] text-rosa-claro"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: silk }}
        >
          <Rombo tam={7} />
          Nos casamos
        </motion.span>

        {/* Se sale ligeramente del margen izquierdo: gesto editorial. */}
        <h1 className="-ml-[0.06em] font-display leading-[0.78]">
          {[evento.pareja.uno, evento.pareja.dos].map((nombre, i) => (
            <span key={nombre} className="block overflow-hidden py-[0.04em]">
              <motion.span
                className="block text-[clamp(3.6rem,17vw,12rem)]"
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.5, delay: 0.25 + i * 0.2, ease: silk }}
              >
                {i === 1 ? <span className="italic">{nombre}</span> : nombre}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-8 max-w-md font-display text-lg italic leading-relaxed text-hueso/60 sm:text-xl"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.1, ease: silk }}
        >
          {evento.frase}
        </motion.p>
      </motion.div>

      <motion.a
        href="#cuenta"
        className="absolute bottom-8 right-6 flex flex-col items-center gap-3 text-hueso/40 transition-colors hover:text-rosa-claro sm:right-12"
        aria-label="Bajar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        style={{ opacity: textoOpacidad }}
      >
        <span className="eyebrow text-[0.5rem]">Desliza</span>
        <motion.span
          className="block h-12 w-px origin-top bg-current"
          animate={reducido ? undefined : { scaleY: [0.25, 1, 0.25] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.a>
    </section>
  );
}
