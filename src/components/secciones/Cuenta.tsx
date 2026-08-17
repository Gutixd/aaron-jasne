import { AnimatePresence, motion } from "framer-motion";
import { RevelarMascara } from "../Revelar";
import { evento } from "@/config/event.config";
import { useCuentaRegresiva, useMovimientoReducido } from "@/hooks";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Cuenta regresiva. Una sola línea de cifras enormes separadas por filetes,
 * no cuatro tarjetas: las tarjetas son el recurso por defecto y aquí
 * habrían roto el tono editorial del resto.
 *
 * Cada dígito rueda por separado, así que a la vista solo se mueve el que
 * realmente cambió — los segundos casi siempre, el resto de tanto en tanto.
 */
export default function Cuenta() {
  const t = useCuentaRegresiva(evento.fecha.iso);

  const unidades = [
    { valor: t?.dias, etiqueta: "Días", ancho: 3 },
    { valor: t?.horas, etiqueta: "Horas", ancho: 2 },
    { valor: t?.minutos, etiqueta: "Min", ancho: 2 },
    { valor: t?.segundos, etiqueta: "Seg", ancho: 2 },
  ];

  return (
    <section id="cuenta" className="relative overflow-hidden bg-noche px-6 py-24 text-hueso sm:py-32">
      <Polvo />

      <div className="relative mx-auto max-w-5xl">
        {t?.llego ? (
          <h2 className="text-center font-display text-[clamp(2rem,7vw,4.5rem)] leading-tight">
            <RevelarMascara>Hoy comienza nuestra historia.</RevelarMascara>
          </h2>
        ) : (
          <>
            <div className="flex items-baseline justify-center gap-1 sm:gap-3">
              {unidades.map((u, i) => (
                <div key={u.etiqueta} className="flex items-baseline">
                  {i > 0 && (
                    <motion.span
                      aria-hidden
                      className="mx-2 block h-14 w-px origin-bottom self-center bg-hueso/15 sm:mx-5 sm:h-20"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: silk }}
                    />
                  )}
                  <Unidad valor={u.valor} etiqueta={u.etiqueta} ancho={u.ancho} orden={i} />
                </div>
              ))}
            </div>

            <motion.p
              className="eyebrow mt-14 text-center text-[0.58rem] text-hueso/35"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5 }}
            >
              {evento.fecha.confirmada
                ? evento.fecha.larga
                : `${evento.fecha.aproximada} · cuenta sobre fecha estimada`}
            </motion.p>
          </>
        )}
      </div>
    </section>
  );
}

function Unidad({
  valor,
  etiqueta,
  ancho,
  orden,
}: {
  valor: number | undefined;
  etiqueta: string;
  ancho: number;
  orden: number;
}) {
  const texto =
    valor === undefined ? "–".repeat(ancho) : String(valor).padStart(ancho, "0");

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1, delay: orden * 0.11, ease: silk }}
    >
      <span className="flex font-display text-[clamp(2.6rem,11vw,6rem)] leading-none tabular-nums">
        {texto.split("").map((d, i) => (
          <Digito key={i} valor={d} />
        ))}
      </span>
      <span className="eyebrow mt-4 text-[0.5rem] text-hueso/40 sm:text-[0.55rem]">
        {etiqueta}
      </span>
    </motion.div>
  );
}

/** Un solo dígito. Al cambiar, el nuevo entra por arriba y el viejo se va. */
function Digito({ valor }: { valor: string }) {
  const reducido = useMovimientoReducido();

  if (reducido) return <span className="inline-block w-[0.6em] text-center">{valor}</span>;

  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={valor}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.5, ease: silk }}
        >
          {valor}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Partículas muy tenues. Dan textura al negro sin robar atención. */
function Polvo() {
  const reducido = useMovimientoReducido();
  if (reducido) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-px w-px rounded-full bg-rosa-claro"
          style={{ left: `${(i * 67) % 100}%`, top: `${(i * 41) % 100}%` }}
          animate={{ y: [0, -30, 0], opacity: [0, 0.55, 0], scale: [1, 2.4, 1] }}
          transition={{
            duration: 7 + (i % 5),
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
