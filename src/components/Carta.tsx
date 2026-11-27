import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Rombo } from "./Marca";
import { useEsEscritorio, useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * La carta: una tarjeta de papel apoyada sobre la noche.
 *
 * En escritorio se inclina siguiendo al puntero, con un brillo que se
 * desplaza por encima como si le diera una luz rasante. Es el gesto que
 * la convierte en un objeto físico y no en un rectángulo claro.
 */
export function Carta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const escritorio = useEsEscritorio();
  const reducido = useMovimientoReducido();
  const inclina = escritorio && !reducido;

  // -0.5 … 0.5 respecto al centro de la carta.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const suave = { stiffness: 150, damping: 20, mass: 0.6 };
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [9, -9]), suave);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [-7, 7]), suave);
  const brilloX = useSpring(useTransform(px, [-0.5, 0.5], ["-30%", "130%"]), suave);

  const seguir = (e: React.PointerEvent) => {
    if (!inclina) return;
    const c = ref.current?.getBoundingClientRect();
    if (!c) return;
    px.set((e.clientX - c.left) / c.width - 0.5);
    py.set((e.clientY - c.top) / c.height - 0.5);
  };

  const soltar = () => {
    px.set(0);
    py.set(0);
  };

  return (
    // El ancho va en esta envoltura, no en la tarjeta: si `w-full` se
    // aplicara dentro, se resolvería contra un padre que se encoge al
    // contenido y la carta saldría estrecha.
    <div className={`[perspective:1400px] ${className}`}>
      <motion.div
        ref={ref}
        onPointerMove={seguir}
        onPointerLeave={soltar}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative w-full overflow-hidden bg-[linear-gradient(157deg,#faf7f1_0%,#f4f0e8_46%,#e9e2d6_100%)] shadow-[0_46px_90px_-28px_rgba(0,0,0,0.72),0_8px_24px_-12px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, y: 70, rotateX: 22, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
        transition={{ duration: 1.6, ease: silk }}
      >
        {/* Fibra del papel */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.055'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Luz rasante que sigue al puntero */}
        {inclina && (
          <motion.span
            aria-hidden
            style={{ x: brilloX }}
            className="pointer-events-none absolute inset-y-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
          />
        )}

        <FiletesYEsquinas />

        <div className="relative px-7 py-12 sm:px-12 sm:py-14">{children}</div>
      </motion.div>
    </div>
  );
}

/** Doble filete perimetral que se dibuja, con un rombo en cada esquina. */
function FiletesYEsquinas() {
  const lados = [
    { c: "left-5 right-5 top-5 h-px origin-left sm:left-7 sm:right-7 sm:top-7", eje: "scaleX" },
    { c: "left-5 right-5 bottom-5 h-px origin-right sm:left-7 sm:right-7 sm:bottom-7", eje: "scaleX" },
    { c: "top-5 bottom-5 left-5 w-px origin-bottom sm:top-7 sm:bottom-7 sm:left-7", eje: "scaleY" },
    { c: "top-5 bottom-5 right-5 w-px origin-top sm:top-7 sm:bottom-7 sm:right-7", eje: "scaleY" },
  ] as const;

  const esquinas = [
    "left-[0.9rem] top-[0.9rem] sm:left-[1.3rem] sm:top-[1.3rem]",
    "right-[0.9rem] top-[0.9rem] sm:right-[1.3rem] sm:top-[1.3rem]",
    "left-[0.9rem] bottom-[0.9rem] sm:left-[1.3rem] sm:bottom-[1.3rem]",
    "right-[0.9rem] bottom-[0.9rem] sm:right-[1.3rem] sm:bottom-[1.3rem]",
  ];

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 text-rosa">
      {/* Filete exterior, más tenue */}
      <span className="absolute inset-3 border border-rosa/15 sm:inset-4" />

      {/* Filete interior, dibujado lado a lado */}
      {lados.map((l, i) => (
        <motion.span
          key={i}
          className={`absolute bg-rosa/45 ${l.c}`}
          initial={{ [l.eje]: 0 }}
          animate={{ [l.eje]: 1 }}
          transition={{ duration: 1.1, delay: 0.5 + i * 0.13, ease: silk }}
        />
      ))}

      {esquinas.map((c, i) => (
        <motion.span
          key={c}
          className={`absolute ${c}`}
          initial={{ opacity: 0, scale: 0.2, rotate: -90 }}
          animate={{ opacity: 0.75, scale: 1, rotate: 0 }}
          transition={{ duration: 0.9, delay: 1.15 + i * 0.09, ease: silk }}
        >
          <Rombo tam={7} />
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Sello de lacre. Cae y se aplasta contra el papel: primero se pasa de
 * tamaño y luego asienta, que es como se comporta algo que se estampa.
 */
export function Sello({ letras, delay = 0 }: { letras: string; delay?: number }) {
  const reducido = useMovimientoReducido();

  return (
    <motion.span
      className="relative flex h-16 w-16 items-center justify-center rounded-full sm:h-[4.5rem] sm:w-[4.5rem]"
      style={{
        background:
          "radial-gradient(circle at 34% 28%, #b96a62 0%, #9c5a54 46%, #6f3a36 100%)",
        boxShadow:
          "0 8px 18px -6px rgba(111,58,54,0.6), inset 0 -3px 7px rgba(0,0,0,0.32), inset 0 2px 5px rgba(255,255,255,0.16)",
      }}
      initial={reducido ? { opacity: 0 } : { opacity: 0, scale: 2.4, y: -40, rotate: -18 }}
      animate={
        reducido
          ? { opacity: 1 }
          : { opacity: 1, scale: [2.4, 0.9, 1.04, 1], y: 0, rotate: [-18, 3, -1, 0] }
      }
      transition={
        reducido
          ? { duration: 0.4, delay }
          : { duration: 1.1, delay, times: [0, 0.55, 0.78, 1], ease: silk }
      }
    >
      {/* Borde irregular del lacre */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-45"
        style={{
          // Cierra con el mismo valor con el que empieza: si no, al dar la
          // vuelta salta de transparente a luz y deja una costura vertical.
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0.16) 0deg, transparent 42deg, rgba(0,0,0,0.2) 108deg, transparent 176deg, rgba(255,255,255,0.12) 244deg, transparent 310deg, rgba(255,255,255,0.16) 360deg)",
        }}
      />
      <span className="relative font-display text-lg leading-none tracking-[0.06em] text-[#f2d9c9] sm:text-xl">
        {letras}
      </span>
    </motion.span>
  );
}
