import { motion } from "framer-motion";
import { Rombo } from "../Marca";
import { RevelarMascara } from "../Revelar";
import { evento, pendiente } from "@/config/event.config";
import { descargarIcs, urlGoogleCalendar } from "@/lib/calendar";
import { medir } from "@/lib/analytics";

const silk = [0.22, 1, 0.36, 1] as const;

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * El gran día — cartel editorial.
 *
 * La fecha funciona como elemento gráfico, no como dato dentro de una
 * tarjeta: el mes ocupa el ancho completo en versalitas enormes y el resto
 * de la información cuelga de él en una retícula desalineada.
 *
 * Aquí vive el bloque de "guardar la fecha", porque es exactamente el
 * momento en que alguien quiere apuntarla.
 */
export default function GranDia() {
  const d = new Date(evento.fecha.iso);
  const mes = MESES[d.getMonth()];
  const dia = String(d.getDate()).padStart(2, "0");
  const hora = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });

  const sinLugar = pendiente(evento.lugar.nombre);

  return (
    <section id="dia" className="relative overflow-hidden bg-noche px-6 py-24 text-hueso sm:py-36">
      <div className="mx-auto max-w-6xl">
        <span className="eyebrow flex items-center gap-3 text-[0.58rem] text-rosa-claro">
          <Rombo tam={7} />
          El gran día
        </span>

        {/* El mes, a lo ancho. Es el titular gráfico de la sección. */}
        <h2 className="mt-8 font-display leading-[0.8]">
          <RevelarMascara duracion={1.4}>
            <span className="block text-[clamp(3.5rem,17vw,12rem)] uppercase tracking-[-0.02em]">
              {mes}
            </span>
          </RevelarMascara>
        </h2>

        <motion.div
          className="mt-6 flex items-end justify-between gap-6 border-b border-hueso/12 pb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
        >
          {/* Sin día confirmado no ponemos un número cualquiera ni un signo
              críptico: se dice con palabras y el año toma el peso gráfico. */}
          {evento.fecha.confirmada ? (
            <>
              <span className="font-display text-[clamp(2.5rem,9vw,5.5rem)] leading-none">
                {dia}
              </span>
              <span className="eyebrow pb-3 text-[0.58rem] text-hueso/45">2027</span>
            </>
          ) : (
            <>
              <span className="eyebrow pb-3 text-[0.58rem] text-hueso/40">
                Día por confirmar
              </span>
              <span className="font-display text-[clamp(2.5rem,9vw,5.5rem)] leading-none">
                2027
              </span>
            </>
          )}
        </motion.div>

        {/* Retícula intencionalmente desigual: 5/4/3 columnas. */}
        <div className="mt-14 grid gap-12 sm:grid-cols-12 sm:gap-8">
          <Dato className="sm:col-span-5" etiqueta="Hora" orden={0}>
            {evento.fecha.confirmada ? (
              <>
                {hora} <span className="text-hueso/40">hrs</span>
              </>
            ) : (
              <span className="text-hueso/40">Por confirmar</span>
            )}
          </Dato>

          <Dato className="sm:col-span-4" etiqueta="Lugar" orden={1}>
            {sinLugar ? (
              <span className="text-hueso/40">Por confirmar</span>
            ) : (
              evento.lugar.nombre
            )}
          </Dato>

          <Dato className="sm:col-span-3" etiqueta="Vestuario" orden={2}>
            {evento.dressCode.titulo}
          </Dato>
        </div>

        {!evento.fecha.confirmada && (
          <motion.p
            className="mt-12 max-w-lg border-l border-rosa/50 pl-5 text-[0.85rem] leading-[1.9] text-hueso/45"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3, ease: silk }}
          >
            Estamos cerrando el día exacto dentro de enero. Guarda la fecha
            aproximada y te avisamos apenas quede confirmada.
          </motion.p>
        )}

        {/* Guardar la fecha */}
        <motion.div
          className="mt-16 flex flex-wrap items-center gap-4"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, delay: 0.2, ease: silk }}
        >
          <a
            href={urlGoogleCalendar()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => medir("clic_calendario", { destino: "google" })}
            className="group relative overflow-hidden border border-hueso/25 px-8 py-4 transition-colors duration-500 hover:border-rosa"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
            <span className="eyebrow relative text-[0.55rem]">Agregar a Google Calendar</span>
          </a>

          <button
            type="button"
            onClick={() => {
              descargarIcs();
              medir("clic_calendario", { destino: "ics" });
            }}
            className="eyebrow cursor-pointer border-b border-hueso/25 pb-1 text-[0.55rem] text-hueso/60 transition-colors hover:border-rosa hover:text-rosa-claro"
          >
            Descargar .ics
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Dato({
  etiqueta,
  children,
  className = "",
  orden,
}: {
  etiqueta: string;
  children: React.ReactNode;
  className?: string;
  orden: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1, delay: orden * 0.12, ease: silk }}
    >
      <span className="eyebrow text-[0.5rem] text-hueso/35">{etiqueta}</span>
      <p className="mt-3 font-display text-2xl leading-tight sm:text-3xl">{children}</p>
    </motion.div>
  );
}
