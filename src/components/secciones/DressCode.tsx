import { motion } from "framer-motion";
import { BandaOliva, Divisor, RamaHorizontal } from "../Ornamentos";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";

/** Banda oliva rasgada arriba y abajo: dress code. */
export default function DressCode() {
  const { vestimenta } = evento;

  return (
    <section id="vestimenta">
      <BandaOliva className="px-7 text-center text-papel-claro">
        <div className="py-10">
          <Aparecer>
            <h2 className="rotulo text-[0.95rem] text-dorado-claro">{vestimenta.titulo}</h2>
            <Divisor className="mt-3 text-dorado-claro" ancho="3rem" />
          </Aparecer>

          <Aparecer delay={0.05}>
            {/* Primer párrafo ("Formal.") destacado; el resto, la explicación. */}
            {vestimenta.nota.split("\n").map((p, i) =>
              i === 0 ? (
                <p key={i} className="manuscrita mt-5 text-[2.3rem] leading-none text-papel-claro">
                  {p}
                </p>
              ) : (
                <p key={i} className="mx-auto mt-4 max-w-[18rem] text-[1.02rem] leading-[1.6] text-papel-claro/90">
                  {p}
                </p>
              ),
            )}
          </Aparecer>

          {/* Colores que no se usan: muestra tachada con su nombre. */}
          <p className="rotulo mt-7 text-[0.64rem] text-dorado-claro">Por favor, evita</p>
          <ul className="mt-3 flex justify-center gap-6" aria-label="Colores que no se deben usar">
            {vestimenta.evitar.map((c, i) => (
              <motion.li
                key={c.nombre}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <span
                  className="relative h-11 w-11 overflow-hidden rounded-full border border-papel-claro/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]"
                  style={{ backgroundColor: c.color }}
                  aria-hidden
                >
                  <span className="absolute left-1/2 top-1/2 h-[2px] w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-dorado-claro shadow-[0_0_0_1px_rgba(56,59,42,0.5)]" />
                </span>
                <span className="text-[0.95rem] italic text-papel-claro/85">{c.nombre}</span>
              </motion.li>
            ))}
          </ul>

          <Aparecer delay={0.1}>
            <span className="mt-6 inline-block text-dorado-claro">
              <RamaHorizontal ancho={96} />
            </span>
          </Aparecer>
        </div>
      </BandaOliva>
    </section>
  );
}
