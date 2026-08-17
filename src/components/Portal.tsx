import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monograma, Rombo } from "./Marca";
import { RevelarLetras } from "./Revelar";
import { evento, textoFecha } from "@/config/event.config";
import { useMagnetico, useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

type Fase = "cargando" | "frase" | "nombres" | "saliendo";

/**
 * La entrada. Es lo único que el invitado ve durante unos segundos, así que
 * carga con casi toda la primera impresión.
 *
 * Secuencia: el monograma se traza mientras carga → "Una historia de dos…" →
 * los nombres emergen desde detrás de una máscara → botón. Al pulsarlo
 * arranca la música y la noche se parte en dos para dejar ver la invitación.
 *
 * La noche no es el fondo del contenedor sino dos hojas independientes: por
 * eso puede abrirse de verdad en vez de solo desvanecerse.
 */
export default function Portal({ onEntrar }: { onEntrar: () => void }) {
  const [fase, setFase] = useState<Fase>("cargando");
  const [visible, setVisible] = useState(true);
  const reducido = useMovimientoReducido();
  const botonRef = useMagnetico<HTMLButtonElement>(0.28, 70);

  const saliendo = fase === "saliendo";

  // Guion de la secuencia. Con movimiento reducido se salta al final.
  useEffect(() => {
    if (reducido) {
      setFase("nombres");
      return;
    }
    const a = window.setTimeout(() => setFase("frase"), 1900);
    const b = window.setTimeout(() => setFase("nombres"), 4600);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [reducido]);

  // Nada se mueve detrás mientras el portal esté puesto.
  useEffect(() => {
    if (!visible) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) window.scrollTo({ top: 0, behavior: "instant" });
  }, [visible]);

  /**
   * Respaldo. El cierre normal lo dispara el fin de la animación, que
   * depende de requestAnimationFrame: si la pestaña pasa a segundo plano
   * justo durante la salida, ese callback no llega nunca y el portal se
   * quedaría tapando la invitación con el scroll bloqueado.
   */
  useEffect(() => {
    if (!saliendo) return;
    const id = window.setTimeout(() => setVisible(false), 3600);
    return () => window.clearTimeout(id);
  }, [saliendo]);

  if (!visible) return null;

  const entrar = () => {
    setFase("saliendo");
    onEntrar();
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden text-hueso">
      {/* Las dos hojas de noche. Se separan al entrar. */}
      {(["izq", "der"] as const).map((lado) => (
        <motion.span
          key={lado}
          aria-hidden
          className={`absolute top-0 h-full w-[50.5%] bg-noche ${
            lado === "izq" ? "left-0" : "right-0"
          }`}
          animate={saliendo ? { x: lado === "izq" ? "-101%" : "101%" } : { x: 0 }}
          transition={{ duration: 1.7, delay: saliendo ? 0.5 : 0, ease: silk }}
          onAnimationComplete={() => {
            if (saliendo && lado === "der") setVisible(false);
          }}
        />
      ))}

      <Atmosfera apagando={saliendo} />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-7 text-center"
        animate={saliendo ? { opacity: 0, scale: 1.04, filter: "blur(6px)" } : {}}
        transition={{ duration: 0.7, ease: silk }}
      >
        <AnimatePresence mode="wait">
          {fase === "cargando" && (
            <motion.div
              key="cargando"
              className="flex flex-col items-center"
              exit={{ opacity: 0, filter: "blur(10px)", scale: 0.94 }}
              transition={{ duration: 0.9, ease: silk }}
            >
              <Monograma tam={44} anillo animarAnillo className="text-hueso" />
              <motion.p
                className="eyebrow mt-12 text-[0.58rem] text-hueso/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.6 }}
              >
                Preparando nuestra historia
              </motion.p>
            </motion.div>
          )}

          {fase === "frase" && (
            <motion.p
              key="frase"
              className="font-display text-[clamp(1.6rem,6.5vw,3rem)] italic text-hueso/85"
              exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
              transition={{ duration: 1, ease: silk }}
            >
              <RevelarLetras texto="Una historia de dos…" animar="animate" paso={0.05} />
            </motion.p>
          )}

          {(fase === "nombres" || saliendo) && (
            <motion.div key="nombres" className="flex w-full flex-col items-center">
              <motion.span
                className="eyebrow text-[0.58rem] text-rosa-claro"
                initial={{ opacity: 0, letterSpacing: "1.4em" }}
                animate={{ opacity: 1, letterSpacing: "0.3em" }}
                transition={{ duration: 2, ease: silk }}
              >
                Nos casamos
              </motion.span>

              <h1 className="mt-8 flex flex-col items-center font-display leading-[0.82]">
                {[evento.pareja.uno, evento.pareja.dos].map((nombre, i) => (
                  <span key={nombre} className="block overflow-hidden py-[0.06em]">
                    <motion.span
                      className="block text-[clamp(3.4rem,16vw,10rem)]"
                      initial={{ y: "115%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 1.5, delay: 0.35 + i * 0.28, ease: silk }}
                    >
                      {nombre}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.span
                className="mt-7 text-rosa-claro"
                initial={{ opacity: 0, rotate: -120, scale: 0.3 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 1.3, delay: 1.15, ease: silk }}
              >
                <Rombo tam={11} />
              </motion.span>

              <motion.p
                className="eyebrow mt-7 text-[0.58rem] text-hueso/50"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 1.35, ease: silk }}
              >
                {textoFecha()}
              </motion.p>

              <motion.button
                ref={botonRef}
                type="button"
                onClick={entrar}
                disabled={saliendo}
                className="group relative mt-16 cursor-pointer overflow-hidden border border-hueso/25 px-11 py-5 transition-[border-color] duration-500 hover:border-rosa-claro/70"
                style={{ willChange: "transform" }}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 1.7, ease: silk }}
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="eyebrow relative text-[0.6rem] text-hueso">
                  Entrar a nuestra historia
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Fugas de luz y polvo suspendido: dan profundidad al negro. */
function Atmosfera({ apagando }: { apagando: boolean }) {
  const reducido = useMovimientoReducido();

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
      animate={{ opacity: apagando ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 h-[85vmin] w-[85vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(156,90,84,0.20) 0%, rgba(156,90,84,0.06) 42%, transparent 70%)",
        }}
        animate={reducido ? undefined : { scale: [1, 1.16, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -left-1/4 top-0 h-full w-1/2 rotate-12"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(244,240,232,0.05), transparent)",
        }}
        animate={reducido ? undefined : { x: ["0%", "260%"] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reducido &&
        Array.from({ length: 20 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full bg-hueso"
            style={{ left: `${(i * 53) % 100}%`, top: `${(i * 31) % 100}%` }}
            animate={{ y: [0, -55, 0], opacity: [0, 0.5, 0] }}
            transition={{
              duration: 8 + (i % 6),
              repeat: Infinity,
              delay: i * 0.42,
              ease: "easeInOut",
            }}
          />
        ))}
    </motion.div>
  );
}
