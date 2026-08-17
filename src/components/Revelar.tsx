import { motion } from "framer-motion";
import type { ReactNode } from "react";

const silk = [0.22, 1, 0.36, 1] as const;

/*
 * Tres formas distintas de revelar texto. Cada sección usa una sola, y
 * secciones vecinas nunca usan la misma: repetir siempre el mismo
 * "aparece desde abajo" es justo lo que hace que una página se sienta hecha
 * en serie.
 */

/**
 * Máscara por línea: el texto sube desde detrás de un borde invisible. Es el
 * revelado más contenido — para titulares grandes en serif.
 */
export function RevelarMascara({
  children,
  delay = 0,
  className = "",
  duracion = 1.1,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  duracion?: number;
}) {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: duracion, delay, ease: silk }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Máscara para titulares en display grande, con las descendentes resueltas.
 *
 * El problema: con `line-height` muy ajustado la caja de línea es más baja
 * que la letra. En Instrument Serif la "J" baja 0.21em bajo la línea base y
 * con `leading-[0.82]` sobresale 0.14em de la caja — un `overflow-hidden`
 * normal le corta la cola. Se veía en "Jasne".
 *
 * La solución es relleno inferior en la máscara (con margen negativo que lo
 * compensa, para no alterar el ritmo vertical). Pero eso agranda la zona
 * visible, así que el texto tiene que arrancar más abajo o asomaría una
 * franja de las letras antes de tiempo: de ahí el 150% inicial.
 *
 * IMPORTANTE: el tamaño de letra va en `className`, sobre esta envoltura.
 * El `desahogo` está en `em` y se resuelve contra el tamaño de fuente de
 * este elemento; si el tamaño se pusiera en un hijo, `em` se calcularía
 * contra los 16px heredados y el relleno se quedaría corto.
 */
export function LineaMascara({
  children,
  delay = 0,
  duracion = 1.5,
  className = "",
  desahogo = "0.2em",
}: {
  children: ReactNode;
  delay?: number;
  duracion?: number;
  className?: string;
  /** Espacio reservado bajo la línea base. Súbelo si la fuente cambia. */
  desahogo?: string;
}) {
  return (
    <span
      className={`block overflow-hidden ${className}`}
      style={{ paddingBottom: desahogo, marginBottom: `-${desahogo}` }}
    >
      <motion.span
        className="block"
        initial={{ y: "150%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: duracion, delay, ease: silk }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Igual que LineaMascara pero se dispara al montar, no al entrar en pantalla. */
export function LineaMascaraAlMontar({
  children,
  delay = 0,
  duracion = 1.5,
  className = "",
  desahogo = "0.2em",
}: {
  children: ReactNode;
  delay?: number;
  duracion?: number;
  className?: string;
  desahogo?: string;
}) {
  return (
    <span
      className={`block overflow-hidden ${className}`}
      style={{ paddingBottom: desahogo, marginBottom: `-${desahogo}` }}
    >
      <motion.span
        className="block"
        initial={{ y: "150%" }}
        animate={{ y: "0%" }}
        transition={{ duration: duracion, delay, ease: silk }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/**
 * Palabra por palabra, con un desenfoque que se disuelve. Para frases con
 * peso emocional, donde interesa que se lean despacio.
 */
export function RevelarPalabras({
  texto,
  delay = 0,
  paso = 0.055,
  className = "",
}: {
  texto: string;
  delay?: number;
  paso?: number;
  className?: string;
}) {
  const palabras = texto.split(" ");

  return (
    <span className={className} aria-label={texto}>
      {palabras.map((p, i) => (
        <motion.span
          key={`${p}-${i}`}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.85, delay: delay + i * paso, ease: silk }}
        >
          {p}
          {i < palabras.length - 1 && " "}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Letra por letra con giro en 3D. Es el más llamativo, así que se reserva
 * para la entrada: usarlo en cada título sería ruido.
 */
export function RevelarLetras({
  texto,
  delay = 0,
  paso = 0.045,
  className = "",
  animar = "whileInView",
}: {
  texto: string;
  delay?: number;
  paso?: number;
  className?: string;
  animar?: "whileInView" | "animate";
}) {
  let n = 0;
  const objetivo = { opacity: 1, y: 0, rotateX: 0 };

  return (
    <span className={`inline-block [perspective:900px] ${className}`} aria-label={texto}>
      {texto.split(" ").map((palabra, p, todas) => (
        <span key={p} className="inline-block whitespace-nowrap">
          {palabra.split("").map((letra, l) => {
            const i = n++;
            const comun = {
              initial: { opacity: 0, y: "0.6em", rotateX: -80 },
              transition: { duration: 1, delay: delay + i * paso, ease: silk },
            };
            return (
              <motion.span
                key={l}
                aria-hidden
                className="inline-block origin-bottom"
                {...comun}
                {...(animar === "animate"
                  ? { animate: objetivo }
                  : { whileInView: objetivo, viewport: { once: true, amount: 0.5 } })}
              >
                {letra}
              </motion.span>
            );
          })}
          {p < todas.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}
