import { motion } from "framer-motion";
import { evento } from "@/config/event.config";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Monograma A · J.
 *
 * Las iniciales van en la serif del sistema y entre ellas se dibuja un rombo
 * hueco con un punto dentro — una marca propia, no un ícono de librería. El
 * anillo opcional se traza con stroke-dasharray para la pantalla de carga.
 */
export function Monograma({
  tam = 64,
  anillo = false,
  animarAnillo = false,
  className = "",
}: {
  tam?: number;
  anillo?: boolean;
  animarAnillo?: boolean;
  className?: string;
}) {
  const r = tam * 0.78;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: r * 2, height: r * 2 }}
      aria-label={`${evento.pareja.uno} y ${evento.pareja.dos}`}
    >
      {anillo && (
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <motion.circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.45"
            initial={animarAnillo ? { pathLength: 0 } : false}
            animate={animarAnillo ? { pathLength: 1 } : undefined}
            transition={{ duration: 2.6, ease: silk }}
          />
        </svg>
      )}

      <span
        className="flex items-center gap-[0.32em] font-display leading-none"
        style={{ fontSize: tam }}
        aria-hidden
      >
        <span>{evento.pareja.monograma.a}</span>
        <Rombo tam={tam * 0.2} />
        <span>{evento.pareja.monograma.b}</span>
      </span>
    </span>
  );
}

/** Rombo hueco con punto. Es el signo que se repite en toda la pieza. */
export function Rombo({ tam = 12, className = "" }: { tam?: number; className?: string }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 12 12"
      className={className}
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <path
        d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
      />
      <circle cx="6" cy="6" r="1.15" fill="currentColor" />
    </svg>
  );
}

/**
 * Separador ornamental: filete — rombo — filete. Los filetes se dibujan al
 * entrar en pantalla, de dentro hacia fuera.
 */
export function Separador({
  className = "",
  ancho = "5rem",
}: {
  className?: string;
  ancho?: string;
}) {
  return (
    <span
      className={`flex items-center justify-center gap-4 text-current ${className}`}
      aria-hidden
    >
      <motion.span
        className="block h-px origin-right bg-current opacity-35"
        style={{ width: ancho }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: silk }}
      />
      <motion.span
        initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
        whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.25, ease: silk }}
      >
        <Rombo tam={9} />
      </motion.span>
      <motion.span
        className="block h-px origin-left bg-current opacity-35"
        style={{ width: ancho }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: silk }}
      />
    </span>
  );
}
