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

          <ul className="mt-7 flex justify-center gap-3" aria-label="Colores sugeridos">
            {vestimenta.paleta.map((c, i) => (
              <motion.li
                key={c}
                className="h-11 w-11 rounded-full border border-papel-claro/35 shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)]"
                style={{ backgroundColor: c }}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            ))}
          </ul>

          <Aparecer delay={0.1}>
            <p className="mx-auto mt-6 max-w-[17rem] text-[1.02rem] italic text-papel-claro/85">
              {vestimenta.nota}
            </p>
            <span className="mt-6 inline-block text-dorado-claro">
              <RamaHorizontal ancho={96} />
            </span>
          </Aparecer>
        </div>
      </BandaOliva>
    </section>
  );
}
