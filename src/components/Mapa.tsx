import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Rombo } from "./Marca";
import { evento } from "@/config/event.config";
import { useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * El plano.
 *
 * Un iframe de Google Maps siempre se ve como un iframe de Google Maps: sus
 * verdes y beiges pelean con toda la paleta. Aquí se trata como una lámina
 * enmarcada — paspartú de papel, filete rosa, y el mapa virado a duotono
 * con los colores de la invitación.
 *
 * En reposo el mapa no es interactivo. Eso resuelve un problema real además
 * del estético: al desplazarse con el dedo sobre un mapa incrustado, el mapa
 * secuestra el gesto y la página se queda clavada. Se activa al tocarlo, y
 * al activarse el virado se suaviza para que sea legible de verdad: bonito
 * en reposo, útil cuando lo usas.
 */
export default function Mapa({ src }: { src: string }) {
  const [activo, setActivo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducido = useMovimientoReducido();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-4%", "4%"]);

  return (
    <motion.div
      ref={ref}
      style={{ y: reducido ? 0 : y }}
      className="relative"
      initial={{ opacity: 0, clipPath: "inset(6% 6% 6% 6%)" }}
      whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.5, ease: silk }}
    >
      {/* Paspartú: el papel que rodea la lámina */}
      <div className="bg-[linear-gradient(150deg,#faf7f1_0%,#f1ece3_100%)] p-3 shadow-[0_36px_70px_-30px_rgba(25,27,31,0.45)] sm:p-4">
        <div className="relative">
          {/* Filete que enmarca la lámina */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 border border-rosa/35"
          />

          <div className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-[16/11]">
            <iframe
              src={src}
              title={`Mapa de ${evento.lugar.nombre || "la celebración"}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              tabIndex={activo ? 0 : -1}
              className="h-full w-full border-0 transition-[filter] duration-700 ease-out"
              style={{
                // En reposo, virado fuerte. Activo, casi limpio para poder leerlo.
                filter: activo
                  ? "grayscale(0.25) contrast(1.02)"
                  : "grayscale(1) contrast(1.14) brightness(1.05)",
                pointerEvents: activo ? "auto" : "none",
              }}
            />

            {/* Duotono: las sombras viran a rosa, las luces a hueso.
                Si el navegador no mezclara sobre el iframe, queda un velo
                de color — se degrada sin romperse.

                La opacidad va en `style` con transición CSS, no animada por
                JS: así el valor correcto está desde el primer pintado. Con
                una animación, el estado inicial sería opacidad 1 y el mapa
                aparecería teñido de rosa sólido hasta que arrancara. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-rosa mix-blend-multiply transition-opacity duration-700 ease-out"
              style={{ opacity: activo ? 0.06 : 0.42 }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-hueso mix-blend-screen transition-opacity duration-700 ease-out"
              style={{ opacity: activo ? 0.05 : 0.3 }}
            />

            {/* Viñeta: hunde los bordes y centra la mirada */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(115% 85% at 50% 45%, transparent 42%, rgba(25,27,31,0.28) 100%)",
              }}
            />

            <Chincheta atenuada={activo} />

            {/* Marcas de esquina, como en una lámina de cartografía */}
            {[
              "left-2.5 top-2.5 border-l border-t",
              "right-2.5 top-2.5 border-r border-t",
              "left-2.5 bottom-2.5 border-b border-l",
              "right-2.5 bottom-2.5 border-b border-r",
            ].map((c, i) => (
              <motion.span
                key={c}
                aria-hidden
                className={`pointer-events-none absolute z-20 h-5 w-5 border-hueso/55 ${c}`}
                initial={{ opacity: 0, scale: 0.4 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.7 + i * 0.08, ease: silk }}
              />
            ))}

            {evento.lugar.coordenadas && (
              <motion.span
                aria-hidden
                // Arriba a la derecha: abajo a la izquierda Google pone su
                // miniatura satelital y las coordenadas quedaban encima.
                className="eyebrow pointer-events-none absolute right-5 top-4 z-20 text-[0.45rem] text-hueso drop-shadow-[0_1px_3px_rgba(25,27,31,0.85)]"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 1, ease: silk }}
              >
                {evento.lugar.coordenadas}
              </motion.span>
            )}

            {/* Capa de activación */}
            <AnimatePresence>
              {!activo && (
                <motion.button
                  type="button"
                  onClick={() => setActivo(true)}
                  // pb-11 lo deja por encima de la franja de créditos de Google.
                  className="absolute inset-0 z-30 flex cursor-pointer items-end justify-center pb-11"
                  aria-label="Activar el mapa para poder moverlo"
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.span
                    className="eyebrow border border-hueso/40 bg-noche/55 px-5 py-2.5 text-[0.45rem] text-hueso backdrop-blur-[3px] transition-colors hover:border-rosa hover:bg-rosa"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 1.15, ease: silk }}
                  >
                    Toca para mover el mapa
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pie de lámina, sobre el paspartú */}
        <div className="flex items-baseline justify-between gap-4 px-1 pt-3.5">
          <span className="eyebrow text-[0.45rem] text-tinta-suave/70">
            {evento.lugar.ciudad || "Ubicación"}
          </span>
          <span className="text-rosa/70">
            <Rombo tam={6} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/** Chincheta propia: el rombo de la invitación, no el globo rojo de Google. */
function Chincheta({ atenuada }: { atenuada: boolean }) {
  const reducido = useMovimientoReducido();

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      animate={{ opacity: atenuada ? 0.35 : 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Ondas que salen del punto */}
      {!reducido &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rosa"
            animate={{ scale: [0.5, 2.4], opacity: [0.7, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 1.5, ease: "easeOut" }}
          />
        ))}

      <motion.span
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-noche text-rosa-claro shadow-[0_6px_16px_-4px_rgba(14,17,22,0.8)]"
        initial={{ y: -28, opacity: 0, scale: 0.5 }}
        whileInView={{ y: 0, opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.9, ease: [0.34, 1.4, 0.64, 1] }}
      >
        <Rombo tam={11} />
      </motion.span>
    </motion.span>
  );
}
