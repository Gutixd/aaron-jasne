import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Rombo, Separador } from "../Marca";
import { RevelarMascara, RevelarPalabras } from "../Revelar";
import { evento, pendiente } from "@/config/event.config";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Nuestra historia — cuatro capítulos, cuatro composiciones distintas.
 *
 * Esta es la sección donde más fácil se cae en la repetición: cuatro bloques
 * iguales alternando izquierda y derecha. Acá cada capítulo tiene su propia
 * maqueta y su propio tipo de entrada, y el cuarto ni siquiera lleva imagen.
 * La coherencia la sostienen la tipografía y el numeral, no el molde.
 */
export default function Historia() {
  const [uno, dos, tres, cuatro] = evento.historia;

  return (
    /* overflow-x-clip: los capítulos entran desplazados en X y, mientras
       esperan fuera de pantalla, ensancharían la página. `clip` los recorta
       sin crear contenedor de scroll, a diferencia de `hidden`. */
    <section id="historia" className="relative overflow-x-clip bg-hueso">
      <div className="px-6 pt-28 pb-4 sm:pt-40">
        <div className="mx-auto max-w-6xl">
          <span className="eyebrow flex items-center gap-3 text-[0.58rem] text-rosa">
            <Rombo tam={7} />
            Nuestra historia
          </span>
        </div>
      </div>

      <CapituloUno cap={uno} />
      <CapituloDos cap={dos} />
      <CapituloTres cap={tres} />
      <CapituloCuatro cap={cuatro} />
    </section>
  );
}

type Cap = (typeof evento.historia)[number];

/* ─────────────────────────────── 01 · texto a la izquierda, foto que se sale */

function CapituloUno({ cap }: { cap: Cap }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <article ref={ref} className="mx-auto grid max-w-6xl gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:pr-0">
      <div className="lg:pr-8">
        <Numeral n={cap.numero} />
        <h3 className="mt-5 font-display text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.05]">
          <RevelarMascara>{cap.titulo}</RevelarMascara>
        </h3>
        <motion.span
          className="mt-7 block h-px w-16 origin-left bg-rosa"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3, ease: silk }}
        />
        <Texto>{cap.texto}</Texto>
      </div>

      {/* Se sale del contenedor por la derecha en pantallas grandes. */}
      <motion.div
        className="relative aspect-[4/5] overflow-hidden lg:aspect-[3/4]"
        initial={{ opacity: 0, y: 60, clipPath: "inset(12% 0% 12% 0%)" }}
        whileInView={{ opacity: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 1.5, ease: silk }}
      >
        <motion.div style={{ y }} className="absolute inset-[-8%]">
          <Imagen src={evento.fotos.historia[0]} alt={cap.titulo} indice={1} />
        </motion.div>
      </motion.div>
    </article>
  );
}

/* ─────────────────────────── 02 · foto a sangre con el texto encima */

function CapituloDos({ cap }: { cap: Cap }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <article ref={ref} className="relative my-10 h-[85svh] min-h-[30rem] w-full overflow-hidden sm:my-16">
      <motion.div style={{ y }} className="absolute inset-[-12%]">
        <Imagen src={evento.fotos.historia[1]} alt={cap.titulo} indice={2} oscuro />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(11,13,17,0.88)_0%,rgba(11,13,17,0.3)_45%,transparent_75%)]" />

      <div className="absolute inset-x-0 bottom-0 px-6 pb-14 sm:px-12 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-lg text-hueso">
            <Numeral n={cap.numero} claro />
            <h3 className="mt-4 font-display text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.05]">
              <RevelarMascara>{cap.titulo}</RevelarMascara>
            </h3>
            <Texto claro>{cap.texto}</Texto>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────────────── 03 · dos fotos en diagonal, texto al medio */

function CapituloTres({ cap }: { cap: Cap }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const izq = useTransform(scrollYProgress, [0, 1], ["6%", "-10%"]);
  const der = useTransform(scrollYProgress, [0, 1], ["-10%", "6%"]);

  return (
    <article ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:py-32">
      <div className="grid items-center gap-8 sm:grid-cols-12 sm:gap-6">
        <motion.div
          style={{ y: izq }}
          className="relative aspect-[3/4] sm:col-span-4 sm:-mt-16"
          initial={{ opacity: 0, x: -50, rotate: -4 }}
          whileInView={{ opacity: 1, x: 0, rotate: -2.5 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, ease: silk }}
        >
          <Imagen src={evento.fotos.historia[2]} alt={cap.titulo} indice={3} />
        </motion.div>

        <div className="text-center sm:col-span-4 sm:px-2">
          <Numeral n={cap.numero} centrado />
          <h3 className="mt-4 font-display text-[clamp(1.9rem,5vw,2.9rem)] leading-[1.08]">
            <RevelarMascara>{cap.titulo}</RevelarMascara>
          </h3>
          <Texto centrado>{cap.texto}</Texto>
        </div>

        <motion.div
          style={{ y: der }}
          className="relative aspect-square sm:col-span-4 sm:mt-20"
          initial={{ opacity: 0, x: 50, rotate: 4 }}
          whileInView={{ opacity: 1, x: 0, rotate: 2 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.4, delay: 0.15, ease: silk }}
        >
          <Imagen src={evento.fotos.historia[3] ?? null} alt={cap.titulo} indice={4} />
        </motion.div>
      </div>
    </article>
  );
}

/* ──────────────────────────────────── 04 · solo tipografía, mucho aire */

function CapituloCuatro({ cap }: { cap: Cap }) {
  return (
    <article className="px-6 py-28 sm:py-44">
      <div className="mx-auto max-w-2xl text-center">
        <Separador className="mx-auto mb-12 text-rosa" ancho="4rem" />
        <Numeral n={cap.numero} centrado />
        <h3 className="mt-6 font-display text-[clamp(2.4rem,8vw,5rem)] leading-[0.95]">
          <RevelarMascara duracion={1.3}>{cap.titulo}</RevelarMascara>
        </h3>
        <p className="mx-auto mt-10 max-w-md font-display text-xl italic leading-relaxed text-tinta-suave sm:text-2xl">
          <RevelarPalabras texto={limpiar(cap.texto)} paso={0.045} />
        </p>
      </div>
    </article>
  );
}

/* ───────────────────────────────────────────────────────────── auxiliares */

function Numeral({
  n,
  claro,
  centrado,
}: {
  n: string;
  claro?: boolean;
  centrado?: boolean;
}) {
  return (
    <motion.span
      className={`eyebrow flex items-center gap-3 text-[0.58rem] ${
        claro ? "text-rosa-claro" : "text-rosa"
      } ${centrado ? "justify-center" : ""}`}
      initial={{ opacity: 0, letterSpacing: "0.9em" }}
      whileInView={{ opacity: 1, letterSpacing: "0.3em" }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: silk }}
    >
      {n}
      <span className={`block h-px w-8 ${claro ? "bg-hueso/30" : "bg-tinta/20"}`} />
    </motion.span>
  );
}

function Texto({
  children,
  claro,
  centrado,
}: {
  children: string;
  claro?: boolean;
  centrado?: boolean;
}) {
  const esMarcador = pendiente(children);

  return (
    <motion.p
      className={[
        "mt-6 max-w-md text-[0.95rem] leading-[1.95]",
        claro ? "text-hueso/65" : "text-tinta-suave",
        centrado ? "mx-auto" : "",
        esMarcador ? "italic opacity-55" : "",
      ].join(" ")}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1.1, delay: 0.25, ease: silk }}
    >
      {limpiar(children)}
    </motion.p>
  );
}

const limpiar = (t: string) => t.replace(/^PENDIENTE\s*—\s*/, "");

/**
 * Hueco de imagen. Sin fotografía dibuja una composición con el numeral y
 * un rombo, no un rectángulo gris: la maqueta se puede mostrar y aprobar
 * antes de que existan las fotos.
 */
function Imagen({
  src,
  alt,
  indice,
  oscuro,
}: {
  src: string | null;
  alt: string;
  indice: number;
  oscuro?: boolean;
}) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />;
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-5 ${
        oscuro ? "bg-noche-alto text-hueso/25" : "bg-hueso-hondo text-piedra"
      }`}
    >
      <Rombo tam={16} />
      <span className="font-display text-6xl leading-none opacity-60">
        {String(indice).padStart(2, "0")}
      </span>
      <span className="eyebrow text-[0.45rem] opacity-70">Fotografía pendiente</span>
    </div>
  );
}

/** Envoltorio por si más adelante se necesita anidar contenido en un capítulo. */
export function Capitulo({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-6">{children}</div>;
}
