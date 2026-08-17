import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Monograma } from "../Marca";
import { evento, textoFecha, pendiente } from "@/config/event.config";

const silk = [0.22, 1, 0.36, 1] as const;

export default function Cierre() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const escala = useTransform(scrollYProgress, [0, 1], [0.72, 1]);
  const opacidad = useTransform(scrollYProgress, [0, 0.7], [0.35, 1]);

  return (
    <footer ref={ref} className="bg-hueso px-6 py-28 text-center sm:py-36">
      <motion.div style={{ scale: escala, opacity: opacidad }} className="inline-block text-tinta">
        <Monograma tam={36} anillo />
      </motion.div>

      <motion.p
        className="eyebrow mt-12 text-[0.55rem] text-tinta-suave"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: silk }}
      >
        {textoFecha()}
      </motion.p>

      {!pendiente(evento.lugar.ciudad) && (
        <p className="eyebrow mt-3 text-[0.5rem] text-tinta-suave/50">{evento.lugar.ciudad}</p>
      )}

      {evento.contacto.length > 0 && (
        <div className="mx-auto mt-16 max-w-sm border-t border-piedra/60 pt-10">
          <span className="eyebrow text-[0.48rem] text-tinta-suave/60">
            Dudas de última hora
          </span>
          <ul className="mt-5 space-y-2">
            {evento.contacto.map((c) => (
              <li key={c.nombre} className="text-[0.85rem] text-tinta-suave">
                {c.nombre} ·{" "}
                <a
                  href={`tel:${c.telefono.replace(/\s/g, "")}`}
                  className="border-b border-rosa/40 transition-colors hover:text-rosa"
                >
                  {c.telefono}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <motion.a
        href="#portada"
        className="eyebrow mt-20 inline-block text-[0.48rem] text-tinta-suave/45 transition-colors hover:text-rosa"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        ↑ Volver al principio
      </motion.a>
    </footer>
  );
}
