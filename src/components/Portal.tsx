import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monograma, Rombo } from "./Marca";
import { RevelarLetras, LineaMascaraAlMontar } from "./Revelar";
import { Carta, Sello } from "./Carta";
import { evento, textoFecha } from "@/config/event.config";
import { useMagnetico, useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

type Fase = "cargando" | "frase" | "carta" | "saliendo";

/**
 * La entrada.
 *
 * Sobre la noche se apoya una carta de papel. La secuencia: el monograma se
 * traza mientras carga → "Una historia de dos…" → la carta llega y se
 * asienta, se dibujan sus filetes, suben los nombres, cae el sello de lacre
 * → al pulsar el botón la carta se eleva y la noche se parte en dos.
 *
 * La noche no es el fondo del contenedor sino dos hojas independientes: por
 * eso puede abrirse de verdad en vez de solo desvanecerse.
 */
export default function Portal({ onEntrar }: { onEntrar: () => void }) {
  const [fase, setFase] = useState<Fase>("cargando");
  const [visible, setVisible] = useState(true);
  const reducido = useMovimientoReducido();
  const botonRef = useMagnetico<HTMLButtonElement>(0.26, 70);

  const saliendo = fase === "saliendo";

  // Guion de la secuencia. Con movimiento reducido se salta a la carta.
  useEffect(() => {
    if (reducido) {
      setFase("carta");
      return;
    }
    const a = window.setTimeout(() => setFase("frase"), 1900);
    const b = window.setTimeout(() => setFase("carta"), 4600);
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
          transition={{ duration: 1.7, delay: saliendo ? 0.55 : 0, ease: silk }}
          onAnimationComplete={() => {
            if (saliendo && lado === "der") setVisible(false);
          }}
        />
      ))}

      <Atmosfera apagando={saliendo} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-y-auto px-5 py-8 text-center">
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

          {(fase === "carta" || saliendo) && (
            <motion.div
              key="carta"
              className="flex w-full flex-col items-center"
              // Al salir, la carta se va hacia arriba antes de que se abra la noche.
              animate={
                saliendo
                  ? { y: -70, opacity: 0, scale: 0.96, filter: "blur(4px)" }
                  : { y: 0, opacity: 1, scale: 1 }
              }
              transition={{ duration: 0.85, ease: silk }}
            >
              <Carta className="w-full max-w-[26rem] text-tinta sm:max-w-[30rem]">
                <motion.span
                  className="eyebrow block text-[0.55rem] text-rosa"
                  initial={{ opacity: 0, letterSpacing: "1.4em" }}
                  animate={{ opacity: 1, letterSpacing: "0.3em" }}
                  transition={{ duration: 1.8, delay: 0.75, ease: silk }}
                >
                  Nos casamos
                </motion.span>

                {/* leading-[0.86] + LineaMascara: la máscara reserva sitio
                    para la cola de la "J", que antes quedaba cortada. */}
                <h1 className="mt-7 flex flex-col items-center font-display leading-[0.86]">
                  {[evento.pareja.uno, evento.pareja.dos].map((nombre, i) => (
                    <LineaMascaraAlMontar
                      key={nombre}
                      className="text-[clamp(2.9rem,13vw,5.4rem)]"
                      delay={0.95 + i * 0.26}
                      duracion={1.45}
                      desahogo="0.22em"
                    >
                      {nombre}
                    </LineaMascaraAlMontar>
                  ))}
                </h1>

                <motion.span
                  className="mt-6 flex justify-center text-rosa"
                  initial={{ opacity: 0, rotate: -120, scale: 0.3 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ duration: 1.2, delay: 1.75, ease: silk }}
                >
                  <Rombo tam={10} />
                </motion.span>

                <motion.p
                  className="eyebrow mt-6 text-[0.55rem] text-tinta-suave"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 1.95, ease: silk }}
                >
                  {textoFecha()}
                </motion.p>

                <div className="mt-9 flex justify-center">
                  <Sello letras={`${evento.pareja.monograma.a}${evento.pareja.monograma.b}`} delay={2.2} />
                </div>
              </Carta>

              <motion.button
                ref={botonRef}
                type="button"
                onClick={entrar}
                disabled={saliendo}
                className="group relative mt-10 cursor-pointer overflow-hidden border border-hueso/25 px-10 py-4.5 transition-[border-color] duration-500 hover:border-rosa-claro/70"
                style={{ willChange: "transform", paddingTop: "1.05rem", paddingBottom: "1.05rem" }}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 2.6, ease: silk }}
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                <span className="eyebrow relative text-[0.58rem] text-hueso">
                  Entrar a nuestra historia
                </span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
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
