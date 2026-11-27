import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Aparición suave al entrar en pantalla: sube un poco y se aclara.
 *
 * El elemento observado es este mismo envoltorio, que nunca está recortado
 * por un `overflow: hidden`. (En la versión anterior las máscaras
 * observaban texto recortado y IntersectionObserver lo veía 0 % visible:
 * diez títulos quedaron invisibles. No repetir ese patrón.)
 */
export default function Aparecer({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
