import { motion } from "framer-motion";
import { Corazon, Divisor, Flores, Ramita, Ramo } from "../Ornamentos";
import IconoPrograma from "../Iconos";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";

/**
 * Programa del día: círculos oliva con el ícono en blanco, unidos por una
 * línea punteada, y un corazón pequeño entre cada momento.
 */
export default function Programa() {
  const { programa, fotos } = evento;

  return (
    <section id="programa" className="papel relative overflow-hidden pb-16 text-center">
      <Flores
        src={fotos.floresArriba}
        className="mx-auto -mt-2 h-auto w-full max-w-[26rem]"
        respaldo={
          <div className="flex justify-between pt-4" aria-hidden>
            <Ramo className="-ml-3 w-24 -rotate-[30deg]" />
            <Ramo className="-mr-3 w-24 rotate-[30deg]" espejo />
          </div>
        }
      />

      <Aparecer className="px-6">
        <span className="inline-block text-dorado">
          <Ramita tam={34} />
        </span>
        <h2 className="titular mt-3 text-[2.3rem] text-oliva-hondo">Programa</h2>
        <p className="manuscrita -mt-1 text-[2.4rem] text-oliva">del día</p>
        <Divisor className="mt-3 text-oliva" />
      </Aparecer>

      <ol className="relative mx-auto mt-10 w-full max-w-[19rem] px-4">
        {/* Línea punteada que une los círculos. */}
        <span
          aria-hidden
          className="absolute bottom-10 left-[3.15rem] top-10 border-l border-dashed border-oliva/45"
        />
        {programa.map((p, i) => (
          <motion.li
            key={p.hora + p.titulo}
            className="relative"
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-5 text-left">
              <span className="relative z-10 flex h-[4.1rem] w-[4.1rem] shrink-0 items-center justify-center rounded-full bg-oliva text-papel-claro shadow-[0_6px_14px_-6px_rgba(56,59,42,0.8)] ring-4 ring-papel">
                <IconoPrograma nombre={p.icono} tam={33} />
              </span>
              <span>
                <span className="block font-serif text-[1.35rem] font-semibold leading-none text-oliva-hondo tabular-nums">
                  {p.hora}
                </span>
                <span className="mt-1 block text-[1.05rem] leading-tight text-tinta">
                  {p.titulo}
                  {p.detalle && (
                    <>
                      <br />
                      {p.detalle}
                    </>
                  )}
                </span>
              </span>
            </div>

            {i < programa.length - 1 && (
              <span className="flex items-center gap-2 py-3 pl-[6.6rem] text-oliva/70" aria-hidden>
                <span className="block h-px w-8 bg-current opacity-50" />
                <Corazon tam={8} />
                <span className="block h-px w-8 bg-current opacity-50" />
              </span>
            )}
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
