import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rombo, Separador } from "../Marca";
import { RevelarMascara } from "../Revelar";
import Confeti from "../Confeti";
import { evento, textoFecha } from "@/config/event.config";
import { supabase, modoDemo } from "@/lib/supabase";
import { hayWhatsapp, mensajeConfirmacion, urlWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analytics";

const silk = [0.22, 1, 0.36, 1] as const;

type Asistencia = "si" | "no";
type Estado = "formulario" | "enviando" | "listo";

type Datos = {
  nombre: string;
  telefono: string;
  asistencia: Asistencia | null;
  acompanantes: number;
  alimentacion: string;
  mensaje: string;
};

const inicial: Datos = {
  nombre: "",
  telefono: "",
  asistencia: null,
  acompanantes: 0,
  alimentacion: "",
  mensaje: "",
};

export default function Confirmar() {
  const [d, setD] = useState<Datos>(inicial);
  const [estado, setEstado] = useState<Estado>("formulario");
  const [error, setError] = useState<string | null>(null);
  const [iniciado, setIniciado] = useState(false);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    if (!iniciado) {
      setIniciado(true);
      medir("rsvp_iniciado");
    }
  };

  const cerrado = Date.now() > new Date(evento.rsvp.cierreIso).getTime();

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación en cliente. La base repite las suyas con CHECK constraints:
    // nunca confiamos solo en el navegador.
    const nombre = d.nombre.trim();
    if (nombre.length < 2) return setError("Escribe tu nombre completo.");
    if (!d.asistencia) return setError("Dinos si nos acompañas.");
    if (d.acompanantes < 0 || d.acompanantes > 10)
      return setError("El número de acompañantes no parece correcto.");

    setEstado("enviando");

    const fila = {
      nombre,
      telefono: d.telefono.trim() || null,
      asistencia: d.asistencia === "si",
      acompanantes: d.asistencia === "si" ? d.acompanantes : 0,
      alimentacion: d.alimentacion.trim() || null,
      mensaje: d.mensaje.trim() || null,
    };

    if (supabase) {
      const { error: err } = await supabase.from("guests").insert(fila);
      if (err) {
        console.error("[rsvp]", err.message);
        setEstado("formulario");
        setError("No pudimos guardar tu respuesta. Inténtalo de nuevo en un momento.");
        return;
      }
    }

    medir(d.asistencia === "si" ? "rsvp_completado" : "rsvp_declinado", {
      acompanantes: fila.acompanantes,
    });
    setEstado("listo");
  };

  const asiste = d.asistencia === "si";
  const nombrePila = d.nombre.trim().split(" ")[0] || "";

  return (
    <section
      id="confirmar"
      className="relative overflow-hidden bg-noche px-6 py-24 text-hueso sm:py-36"
    >
      {/* Halo tenue detrás del formulario. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(156,90,84,0.14) 0%, transparent 68%)",
        }}
      />

      <Confeti activo={estado === "listo" && asiste} />

      <div className="relative mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          {estado === "listo" ? (
            <Gracias key="gracias" datos={d} nombrePila={nombrePila} />
          ) : (
            <motion.div key="form" exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.6 }}>
              <div className="text-center">
                <span className="eyebrow inline-flex items-center gap-3 text-[0.58rem] text-rosa-claro">
                  <Rombo tam={7} />
                  Confirmación
                </span>
                <h2 className="mt-6 font-display text-[clamp(2.4rem,8vw,4.6rem)] leading-[0.95]">
                  <RevelarMascara duracion={1.3}>¿Nos acompañas?</RevelarMascara>
                </h2>
                <motion.p
                  className="mt-6 text-[0.9rem] leading-[1.9] text-hueso/50"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.4 }}
                >
                  {cerrado
                    ? "Las confirmaciones ya cerraron. Escríbenos directo y lo vemos."
                    : `Nos ayuda muchísimo saberlo con tiempo. Hasta el ${evento.rsvp.cierreTexto}.`}
                </motion.p>
              </div>

              <form onSubmit={enviar} className="mt-14 space-y-9" noValidate>
                <Campo etiqueta="Nombre completo" htmlFor="nombre">
                  <input
                    id="nombre"
                    className="campo"
                    value={d.nombre}
                    onChange={(e) => set("nombre", e.target.value)}
                    placeholder="Cómo te presentamos"
                    autoComplete="name"
                    disabled={cerrado}
                    required
                  />
                </Campo>

                <Campo etiqueta="Teléfono" htmlFor="telefono" opcional>
                  <input
                    id="telefono"
                    type="tel"
                    className="campo"
                    value={d.telefono}
                    onChange={(e) => set("telefono", e.target.value)}
                    placeholder="+56 9 ..."
                    autoComplete="tel"
                    disabled={cerrado}
                  />
                </Campo>

                <fieldset disabled={cerrado}>
                  <legend className="eyebrow text-[0.5rem] text-hueso/40">
                    ¿Confirmas tu asistencia?
                  </legend>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["si", "Sí, estaré presente"],
                        ["no", "No podré asistir"],
                      ] as const
                    ).map(([valor, texto]) => {
                      const activo = d.asistencia === valor;
                      return (
                        <label
                          key={valor}
                          className={`relative cursor-pointer overflow-hidden border px-5 py-5 text-center transition-colors duration-500 ${
                            activo
                              ? "border-rosa text-hueso"
                              : "border-hueso/18 text-hueso/55 hover:border-hueso/45"
                          }`}
                        >
                          <motion.span
                            className="absolute inset-0 bg-rosa"
                            initial={false}
                            animate={{ scaleY: activo ? 1 : 0 }}
                            style={{ originY: 1 }}
                            transition={{ duration: 0.5, ease: silk }}
                          />
                          <input
                            type="radio"
                            name="asistencia"
                            value={valor}
                            checked={activo}
                            onChange={() => set("asistencia", valor)}
                            className="sr-only"
                          />
                          <span className="eyebrow relative text-[0.55rem]">{texto}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Los campos de detalle solo existen si viene. */}
                <AnimatePresence initial={false}>
                  {asiste && (
                    <motion.div
                      className="space-y-9 overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.7, ease: silk }}
                    >
                      <Campo etiqueta="Acompañantes" htmlFor="acompanantes">
                        <Contador
                          valor={d.acompanantes}
                          onCambio={(v) => set("acompanantes", v)}
                        />
                      </Campo>

                      <Campo etiqueta="Restricciones alimentarias" htmlFor="alimentacion" opcional>
                        <input
                          id="alimentacion"
                          className="campo"
                          value={d.alimentacion}
                          onChange={(e) => set("alimentacion", e.target.value)}
                          placeholder="Vegetariano, sin gluten, alergias…"
                        />
                      </Campo>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Campo
                  etiqueta={`Mensaje para ${evento.pareja.uno} & ${evento.pareja.dos}`}
                  htmlFor="mensaje"
                  opcional
                >
                  <textarea
                    id="mensaje"
                    rows={3}
                    className="campo resize-none"
                    value={d.mensaje}
                    onChange={(e) => set("mensaje", e.target.value)}
                    disabled={cerrado}
                  />
                </Campo>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      role="alert"
                      className="border-l-2 border-rosa-claro pl-4 text-[0.85rem] text-rosa-claro"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={estado === "enviando" || cerrado}
                  className="group relative w-full cursor-pointer overflow-hidden border border-hueso/25 py-5 transition-colors duration-500 hover:border-rosa disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100 group-disabled:scale-y-0" />
                  <span className="eyebrow relative text-[0.58rem]">
                    {estado === "enviando" ? "Enviando…" : "Confirmar asistencia"}
                  </span>
                </button>

                {modoDemo && (
                  <p className="text-center text-[0.72rem] text-hueso/30">
                    Modo demostración: la respuesta se valida pero no se guarda.
                  </p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── gracias */

function Gracias({ datos, nombrePila }: { datos: Datos; nombrePila: string }) {
  const asiste = datos.asistencia === "si";

  return (
    <motion.div
      className="py-8 text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: silk }}
    >
      <motion.span
        className="inline-block text-rosa-claro"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, delay: 0.2, ease: silk }}
      >
        <Rombo tam={26} />
      </motion.span>

      <h2 className="mt-10 font-display text-[clamp(2rem,7vw,3.6rem)] leading-[1.05]">
        {asiste ? (
          <>
            ¡Gracias{nombrePila && `, ${nombrePila}`}!
          </>
        ) : (
          <>Gracias por avisarnos</>
        )}
      </h2>

      <p className="mx-auto mt-7 max-w-sm text-[0.95rem] leading-[1.95] text-hueso/55">
        {asiste
          ? "Nos alegra muchísimo saber que estarás con nosotros. Te escribiremos con los detalles finales apenas los tengamos."
          : "Te vamos a extrañar ese día. Gracias por tomarte el momento de decirnos."}
      </p>

      <Separador className="mx-auto mt-12 text-hueso/25" ancho="3rem" />

      {asiste && hayWhatsapp() && (
        <div className="mt-12">
          <p className="eyebrow text-[0.55rem] text-hueso/40">
            ¿Quieres avisarnos directamente por WhatsApp?
          </p>
          <a
            href={urlWhatsapp(mensajeConfirmacion(datos.nombre.trim(), datos.acompanantes))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => medir("clic_whatsapp", { origen: "rsvp" })}
            className="group relative mt-6 inline-block overflow-hidden border border-hueso/25 px-9 py-4 transition-colors duration-500 hover:border-rosa"
          >
            <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
            <span className="eyebrow relative text-[0.55rem]">Confirmar por WhatsApp</span>
          </a>
          <p className="mx-auto mt-5 max-w-xs text-[0.72rem] leading-relaxed text-hueso/25">
            Se abre WhatsApp con el mensaje escrito. Tú decides cuándo enviarlo.
          </p>
        </div>
      )}

      <p className="mt-14 font-display text-lg italic text-hueso/35">
        {textoFecha()}
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────── piezas */

function Campo({
  etiqueta,
  htmlFor,
  opcional,
  children,
}: {
  etiqueta: string;
  htmlFor: string;
  opcional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="eyebrow flex items-baseline gap-2 text-[0.5rem] text-hueso/40">
        {etiqueta}
        {opcional && <span className="text-[0.42rem] text-hueso/22">opcional</span>}
      </label>
      <div className="mt-2 text-hueso">{children}</div>
    </div>
  );
}

/** Contador con botones grandes: en móvil es mucho mejor que un select. */
function Contador({ valor, onCambio }: { valor: number; onCambio: (v: number) => void }) {
  const paso = (delta: number) => onCambio(Math.min(10, Math.max(0, valor + delta)));

  return (
    <div className="flex items-center gap-6 border-b border-hueso/20 pb-3">
      <button
        type="button"
        onClick={() => paso(-1)}
        disabled={valor === 0}
        aria-label="Quitar un acompañante"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-hueso/20 text-hueso/70 transition-colors hover:border-rosa hover:text-rosa-claro disabled:opacity-25"
      >
        −
      </button>

      <span className="relative h-9 w-8 overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={valor}
            className="absolute inset-0 flex items-center justify-center font-display text-3xl leading-none tabular-nums"
            initial={{ y: 26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -26, opacity: 0 }}
            transition={{ duration: 0.35, ease: silk }}
          >
            {valor}
          </motion.span>
        </AnimatePresence>
      </span>

      <button
        type="button"
        onClick={() => paso(1)}
        disabled={valor === 10}
        aria-label="Agregar un acompañante"
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-hueso/20 text-hueso/70 transition-colors hover:border-rosa hover:text-rosa-claro disabled:opacity-25"
      >
        +
      </button>

      <span className="text-[0.8rem] text-hueso/35">
        {valor === 0 ? "Voy solo/a" : valor === 1 ? "1 persona más" : `${valor} personas más`}
      </span>
    </div>
  );
}
