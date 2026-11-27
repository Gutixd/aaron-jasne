import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Corazon, Divisor } from "../Ornamentos";
import Aparecer from "../Aparecer";
import Confeti from "../Confeti";
import { evento } from "@/config/event.config";
import { hayWhatsapp, mensajeConfirmacion, urlWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analytics";

type Asistencia = "si" | "no";
type Estado = "formulario" | "enviando" | "listo";

/** Endpoint PHP en el mismo dominio. En local lo atiende el proxy de Vite. */
const API_CONFIRMAR = "/api/confirmar.php";

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

const textoRespuesta = (d: Datos) =>
  mensajeConfirmacion({
    nombre: d.nombre.trim(),
    asiste: d.asistencia === "si",
    acompanantes: d.asistencia === "si" ? d.acompanantes : 0,
    telefono: d.telefono.trim(),
    alimentacion: d.asistencia === "si" ? d.alimentacion.trim() : "",
    mensaje: d.mensaje.trim(),
  });

const boton =
  "rotulo rounded-sm bg-oliva px-7 py-3.5 text-[0.74rem] text-papel-claro shadow-[0_6px_14px_-8px_rgba(56,59,42,0.9)] transition-colors hover:bg-oliva-hondo disabled:cursor-not-allowed disabled:opacity-50";

export default function Confirmar() {
  const [d, setD] = useState<Datos>(inicial);
  const [estado, setEstado] = useState<Estado>("formulario");
  const [error, setError] = useState<string | null>(null);
  // Si el servidor falla, se ofrece WhatsApp para que nadie quede atascado.
  const [respaldo, setRespaldo] = useState(false);
  // true = la respuesta NO quedó guardada; viaja solo por WhatsApp.
  const [porWhatsapp, setPorWhatsapp] = useState(false);
  const [trampa, setTrampa] = useState("");
  const [iniciado, setIniciado] = useState(false);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    if (!iniciado) {
      setIniciado(true);
      medir("rsvp_iniciado");
    }
  };

  const cerrado = Date.now() > new Date(evento.rsvp.cierreIso).getTime();
  const asiste = d.asistencia === "si";

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRespaldo(false);

    const nombre = d.nombre.trim();
    if (nombre.length < 2) return setError("Escribe tu nombre completo.");
    if (!d.asistencia) return setError("Cuéntanos si nos acompañas.");

    setEstado("enviando");
    try {
      const r = await fetch(API_CONFIRMAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          telefono: d.telefono.trim(),
          asiste,
          acompanantes: asiste ? d.acompanantes : 0,
          alimentacion: asiste ? d.alimentacion.trim() : "",
          mensaje: d.mensaje.trim(),
          sitio: trampa,
        }),
      });
      const json = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!r.ok || !json?.ok) {
        setEstado("formulario");
        if (r.status === 422 || r.status === 429) return setError(json?.error ?? "Revisa los datos.");
        setRespaldo(hayWhatsapp());
        return setError("No pudimos guardar tu respuesta en este momento.");
      }
    } catch {
      setEstado("formulario");
      setRespaldo(hayWhatsapp());
      return setError("No hay conexión con el servidor en este momento.");
    }

    medir(asiste ? "rsvp_completado" : "rsvp_declinado", { acompanantes: asiste ? d.acompanantes : 0 });
    setEstado("listo");
  };

  return (
    <section id="confirmar" className="papel relative px-6 pb-16 pt-14 text-center">
      <Confeti activo={estado === "listo" && asiste} />

      <Aparecer>
        <h2 className="titular text-[2.2rem] text-oliva-hondo">Confirma</h2>
        <p className="manuscrita -mt-1 text-[2.3rem] text-oliva">tu asistencia</p>
        <Divisor className="mt-3 text-oliva" />
      </Aparecer>

      <AnimatePresence mode="wait">
        {estado === "listo" ? (
          <Gracias key="gracias" datos={d} porWhatsapp={porWhatsapp} />
        ) : (
          <motion.form
            key="form"
            onSubmit={enviar}
            noValidate
            exit={{ opacity: 0, y: -10 }}
            className="relative mx-auto mt-6 max-w-[21rem] text-left"
          >
            <p className="text-center text-[1.02rem] italic text-tinta-suave">
              {cerrado
                ? "Las confirmaciones ya cerraron. Escríbenos y lo vemos."
                : `Te agradeceremos confirmar antes del ${evento.rsvp.cierreTexto}.`}
            </p>

            <Campo etiqueta="Nombre completo" htmlFor="nombre">
              <input
                id="nombre"
                className="campo"
                value={d.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Cómo te presentamos"
                autoComplete="name"
                disabled={cerrado}
              />
            </Campo>

            <Campo etiqueta="Teléfono" htmlFor="telefono" opcional>
              <input
                id="telefono"
                type="tel"
                inputMode="tel"
                className="campo"
                value={d.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                placeholder="+56 9 …"
                autoComplete="tel"
                disabled={cerrado}
              />
            </Campo>

            <fieldset className="mt-7" disabled={cerrado}>
              <legend className="rotulo text-[0.68rem] text-tinta-suave">¿Nos acompañas?</legend>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {(
                  [
                    ["si", "Sí, ahí estaré"],
                    ["no", "No podré ir"],
                  ] as const
                ).map(([valor, texto]) => {
                  const activo = d.asistencia === valor;
                  return (
                    <label
                      key={valor}
                      className={`cursor-pointer rounded-sm border px-3 py-3.5 text-center text-[1.02rem] transition-colors ${
                        activo
                          ? "border-oliva bg-oliva text-papel-claro"
                          : "border-linea bg-papel-claro/60 text-tinta hover:border-oliva"
                      }`}
                    >
                      <input
                        type="radio"
                        name="asistencia"
                        value={valor}
                        checked={activo}
                        onChange={() => set("asistencia", valor)}
                        className="sr-only"
                      />
                      {texto}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <AnimatePresence initial={false}>
              {asiste && (
                <motion.div
                  className="overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <Campo etiqueta="Acompañantes" htmlFor="acompanantes">
                    <Contador
                      valor={d.acompanantes}
                      // Suma sobre el valor más reciente: dos toques rápidos
                      // antes de redibujar contaban como uno.
                      onPaso={(delta) =>
                        setD((prev) => ({
                          ...prev,
                          acompanantes: Math.min(10, Math.max(0, prev.acompanantes + delta)),
                        }))
                      }
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

            <Campo etiqueta={`Un mensaje para ${evento.pareja.uno} y ${evento.pareja.dos}`} htmlFor="mensaje" opcional>
              <textarea
                id="mensaje"
                rows={3}
                className="campo resize-none"
                value={d.mensaje}
                onChange={(e) => set("mensaje", e.target.value)}
                disabled={cerrado}
              />
            </Campo>

            {/* Trampa para bots: invisible para personas y lectores de pantalla. */}
            <input
              type="text"
              name="sitio"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />

            {error && (
              <p role="alert" className="mt-6 border-l-2 border-dorado pl-3 text-[0.98rem] text-oliva-hondo">
                {error}
                {respaldo && (
                  <a
                    href={urlWhatsapp(textoRespuesta(d))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      medir("clic_whatsapp", { origen: "rsvp_respaldo" });
                      setPorWhatsapp(true);
                      setEstado("listo");
                    }}
                    className="mt-1 block font-semibold underline underline-offset-4"
                  >
                    Envíanos tu respuesta por WhatsApp
                  </a>
                )}
              </p>
            )}

            <div className="mt-8 text-center">
              <button type="submit" disabled={cerrado || estado === "enviando"} className={boton}>
                {estado === "enviando" ? "Enviando…" : "Confirmar asistencia"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── gracias */

function Gracias({ datos, porWhatsapp }: { datos: Datos; porWhatsapp: boolean }) {
  const asiste = datos.asistencia === "si";
  const nombrePila = datos.nombre.trim().split(" ")[0] || "";

  return (
    <motion.div
      className="mx-auto mt-8 max-w-[20rem]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <span className="inline-block text-oliva">
        <Corazon tam={22} />
      </span>
      <p className="manuscrita mt-3 text-[2.6rem] text-oliva-hondo">
        {asiste ? `¡Gracias${nombrePila ? `, ${nombrePila}` : ""}!` : "Gracias por avisarnos"}
      </p>
      <p className="mt-3 text-[1.05rem] text-tinta">
        {asiste
          ? "Nos alegra muchísimo saber que estarás con nosotros."
          : "Te vamos a extrañar ese día. Gracias por contarnos."}
      </p>

      {hayWhatsapp() && (
        <div className="mt-8">
          <p className="text-[0.98rem] italic text-tinta-suave">
            {porWhatsapp
              ? "Abrimos WhatsApp con tu respuesta escrita. Solo falta tocar enviar para que nos llegue."
              : "Tu respuesta ya nos llegó. Si además quieres escribirnos:"}
          </p>
          <a
            href={urlWhatsapp(textoRespuesta(datos))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => medir("clic_whatsapp", { origen: "rsvp_gracias" })}
            className={`${boton} mt-4 inline-block`}
          >
            {porWhatsapp ? "Abrir WhatsApp de nuevo" : "Avisar por WhatsApp"}
          </a>
        </div>
      )}
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
    <div className="mt-6">
      <label htmlFor={htmlFor} className="rotulo flex items-baseline gap-2 text-[0.66rem] text-tinta-suave">
        {etiqueta}
        {opcional && <span className="font-serif text-[0.8rem] normal-case tracking-normal italic opacity-70">opcional</span>}
      </label>
      {children}
    </div>
  );
}

function Contador({ valor, onPaso }: { valor: number; onPaso: (delta: number) => void }) {
  const redondo =
    "flex h-10 w-10 items-center justify-center rounded-full border border-linea text-[1.3rem] leading-none text-oliva transition-colors hover:border-oliva disabled:opacity-30";
  return (
    <div className="mt-2 flex items-center gap-5 border-b border-linea pb-3">
      <button type="button" onClick={() => onPaso(-1)} disabled={valor === 0} aria-label="Quitar un acompañante" className={redondo}>
        −
      </button>
      <span className="w-6 text-center font-serif text-[1.8rem] font-semibold leading-none text-oliva-hondo tabular-nums">
        {valor}
      </span>
      <button type="button" onClick={() => onPaso(1)} disabled={valor === 10} aria-label="Agregar un acompañante" className={redondo}>
        +
      </button>
      <span className="text-[1rem] italic text-tinta-suave">
        {valor === 0 ? "Voy solo/a" : valor === 1 ? "1 persona más" : `${valor} personas más`}
      </span>
    </div>
  );
}
