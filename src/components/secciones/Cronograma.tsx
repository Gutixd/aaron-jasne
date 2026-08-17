import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { Rombo } from "../Marca";
import { RevelarMascara } from "../Revelar";
import { evento, type ItemCronograma } from "@/config/event.config";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Cronograma. La línea se dibuja a medida que se baja y cada hito enciende
 * su rombo al llegar. Los bloques van escalonados en sangría creciente en
 * vez de perfectamente alineados: la mínima irregularidad es lo que hace
 * que se lea dibujado a mano y no generado.
 */
export default function Cronograma() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 78%", "end 65%"],
  });
  const avance = useSpring(scrollYProgress, { stiffness: 70, damping: 24, restDelta: 0.001 });

  return (
    <section className="bg-hueso-hondo px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <span className="eyebrow inline-flex items-center gap-3 text-[0.58rem] text-rosa">
            <Rombo tam={7} />
            Cómo será
          </span>
          <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,3.6rem)] leading-none">
            <RevelarMascara>El itinerario</RevelarMascara>
          </h2>
        </div>

        <div ref={ref} className="relative pl-12 sm:pl-20">
          {/* Riel completo, tenue */}
          <span aria-hidden className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px bg-tinta/12 sm:left-[15px]" />
          {/* Riel que se dibuja */}
          <motion.span
            aria-hidden
            className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-px origin-top bg-rosa sm:left-[15px]"
            style={{ scaleY: avance }}
          />

          <ol className="space-y-14 sm:space-y-16">
            {evento.cronograma.map((item, i) => (
              <Hito key={item.hora} item={item} indice={i} avance={avance} total={evento.cronograma.length} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Hito({
  item,
  indice,
  avance,
  total,
}: {
  item: ItemCronograma;
  indice: number;
  avance: ReturnType<typeof useSpring>;
  total: number;
}) {
  // El rombo se enciende cuando la línea dibujada lo alcanza.
  const umbral = (indice + 0.35) / total;
  const encendido = useTransform(avance, (v) => (v >= umbral ? 1 : 0));
  const escala = useTransform(avance, (v) => (v >= umbral ? 1 : 0.55));

  // Sangría creciente y leve: rompe la columna perfecta.
  const sangria = [0, 10, 4, 16, 8][indice % 5];

  return (
    <motion.li
      className="relative"
      style={{ marginLeft: sangria }}
      initial={{ opacity: 0, x: -28 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 1, ease: silk }}
    >
      <motion.span
        aria-hidden
        className="absolute -left-12 top-1 text-rosa sm:-left-20"
        style={{ opacity: encendido, scale: escala, marginLeft: -sangria }}
      >
        <span className="ml-[1px] block sm:ml-[9px]">
          <Rombo tam={14} />
        </span>
      </motion.span>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <span className="font-display text-3xl leading-none text-rosa tabular-nums sm:text-4xl">
          {item.hora}
        </span>
        <h3 className="font-display text-2xl leading-none sm:text-3xl">{item.titulo}</h3>
      </div>

      {item.descripcion && (
        <p className="mt-3 max-w-sm text-[0.9rem] leading-[1.9] text-tinta-suave">
          {item.descripcion}
        </p>
      )}
    </motion.li>
  );
}
