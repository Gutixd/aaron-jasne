import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Corazon, Divisor } from "../Ornamentos";
import Aparecer from "../Aparecer";
import Confeti from "../Confeti";
import { evento } from "@/config/event.config";
import { hayWhatsapp, mensajeConfirmacion, urlWhatsapp } from "@/lib/whatsapp";
import { medir } from "@/lib/analytics";
import { type Invitado, useInvitadoDelLink } from "@/lib/invitado";

type Asistencia = "si" | "no";
type Estado = "formulario" | "enviando" | "listo";

/** Endpoints PHP en el mismo dominio. En local los atiende el proxy de Vite. */
const API_CONFIRMAR = "/api/confirmar.php";
const API_BUSCAR = "/api/buscar.php";


/**
 * Paso del formulario:
 * - "nombre": solo pide el nombre y lo busca en la lista.
 * - "abierto": no hay lista cargada; confirma cualquiera (como antes).
 * - "invitado": está en la lista; se le saluda y se limitan sus cupos.
 * - "no_esta" / "varios" / "corto": no se pudo identificar.
 */
type Paso =
  | { tipo: "nombre" }
  | { tipo: "abierto" }
  | { tipo: "invitado"; invitado: Invitado }
  | { tipo: "no_esta" | "varios" | "corto" };

const MAX_ABIERTO = 10;

type Datos = {
  nombre: string;
  telefono: string;
  asistencia: Asistencia | null;
  acompanantes: number;
  alimentacion: string;
  canciones: string;
  mensaje: string;
};

const inicial: Datos = {
  nombre: "",
  telefono: "",
  asistencia: null,
  acompanantes: 0,
  alimentacion: "",
  canciones: "",
  mensaje: "",
};

const textoRespuesta = (d: Datos) =>
  mensajeConfirmacion({
    nombre: d.nombre.trim(),
    asiste: d.asistencia === "si",
    acompanantes: d.asistencia === "si" ? d.acompanantes : 0,
    telefono: d.telefono.trim(),
    alimentacion: d.asistencia === "si" ? d.alimentacion.trim() : "",
    canciones: d.canciones.trim(),
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
  const [paso, setPaso] = useState<Paso>({ tipo: "nombre" });

  // Link personal: el invitado llega ya identificado, sin escribir nada.
  const delLink = useInvitadoDelLink();
  useEffect(() => {
    if (!delLink) return;
    setPaso((p) => (p.tipo === "nombre" ? { tipo: "invitado", invitado: delLink } : p));
    setD((prev) => (prev.nombre ? prev : { ...prev, nombre: delLink.nombre }));
  }, [delLink]);
  const [buscando, setBuscando] = useState(false);

  const set = <K extends keyof Datos>(k: K, v: Datos[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    if (!iniciado) {
      setIniciado(true);
      medir("rsvp_iniciado");
    }
  };

  const cerrado = Date.now() > new Date(evento.rsvp.cierreIso).getTime();
  const asiste = d.asistencia === "si";
  const invitado = paso.tipo === "invitado" ? paso.invitado : null;
  // Acompañantes posibles: los cupos del invitado menos él, o 10 sin lista.
  const maxAcompanantes = invitado ? invitado.cupos - 1 : MAX_ABIERTO;
  const formularioAbierto = paso.tipo === "abierto" || paso.tipo === "invitado";

  const buscar = async () => {
    setError(null);
    const nombre = d.nombre.trim();
    if (nombre.split(/\s+/).length < 2) return setError("Escribe tu nombre y apellido.");
    setBuscando(true);
    try {
      const r = await fetch(API_BUSCAR, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      const json = (await r.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        modo?: string;
        encontrado?: boolean;
        motivo?: string;
        invitado?: Invitado;
      } | null;
      if (r.status === 422 || r.status === 429) return setError(json?.error ?? "Revisa tu nombre.");
      if (!r.ok || !json?.ok || json.modo === "abierto") {
        // Sin lista (o sin servidor) se deja confirmar igual; si el envío
        // también falla, se ofrece WhatsApp.
        return setPaso({ tipo: "abierto" });
      }
      if (json.encontrado && json.invitado) {
        const inv = json.invitado;
        medir("invitado_encontrado", { cupos: inv.cupos });
        setD((prev) => ({ ...prev, acompanantes: Math.min(prev.acompanantes, inv.cupos - 1) }));
        return setPaso({ tipo: "invitado", invitado: inv });
      }
      medir("invitado_no_encontrado");
      setPaso({ tipo: json.motivo === "varios" ? "varios" : json.motivo === "corto" ? "corto" : "no_esta" });
    } catch {
      setPaso({ tipo: "abierto" });
    } finally {
      setBuscando(false);
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRespaldo(false);

    if (!formularioAbierto) return void (await buscar());

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
          canciones: d.canciones.trim(),
          mensaje: d.mensaje.trim(),
          // Con el código, el servidor sabe quién es aunque el nombre escrito
          // sea "Familia Pérez" y no un nombre y apellido.
          codigo: paso.tipo === "invitado" ? paso.invitado.codigo : undefined,
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
          <Gracias
            key="gracias"
            datos={d}
            porWhatsapp={porWhatsapp}
            saludo={paso.tipo === "invitado" ? paso.invitado.nombre : undefined}
          />
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

            <Campo etiqueta="Tu nombre y apellido" htmlFor="nombre">
              <input
                id="nombre"
                className="campo"
                value={d.nombre}
                onChange={(e) => {
                  set("nombre", e.target.value);
                  // Cambiar el nombre obliga a buscar de nuevo.
                  if (paso.tipo !== "abierto" && paso.tipo !== "nombre") setPaso({ tipo: "nombre" });
                }}
                placeholder="Como aparece en tu invitación"
                autoComplete="name"
                disabled={cerrado}
              />
            </Campo>

            <AnimatePresence mode="wait" initial={false}>
              {invitado && (
                <motion.div
                  key="saludo"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 rounded-sm border border-linea bg-papel-claro/70 px-4 py-4 text-center"
                >
                  <p className="manuscrita text-[2rem] leading-tight text-oliva-hondo">¡Hola, {invitado.nombre}!</p>
                  <p className="mt-1 text-[1.02rem] text-tinta">
                    {invitado.cupos === 1
                      ? "Tenemos un lugar reservado para ti."
                      : `Reservamos ${invitado.cupos} lugares para ustedes.`}
                  </p>
                  {invitado.previa && (
                    <p className="mt-2 text-[0.95rem] italic text-tinta-suave">
                      Ya recibimos tu respuesta (
                      {invitado.previa.asiste
                        ? `${invitado.previa.personas} ${invitado.previa.personas === 1 ? "persona" : "personas"}`
                        : "no asistirán"}
                      ). Si confirmas de nuevo, la reemplazamos.
                    </p>
                  )}
                </motion.div>
              )}
              {(paso.tipo === "no_esta" || paso.tipo === "varios" || paso.tipo === "corto") && (
                <motion.p
                  key="no-esta"
                  role="alert"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 border-l-2 border-dorado pl-3 text-[0.98rem] text-oliva-hondo"
                >
                  {paso.tipo === "varios"
                    ? "Hay más de una invitación con ese nombre. Escribe tu nombre completo, con tus dos apellidos."
                    : paso.tipo === "corto"
                      ? "Escribe tu nombre y tu apellido."
                      : "No encontramos tu nombre en la lista. Prueba escribirlo como aparece en tu invitación."}
                  {paso.tipo === "no_esta" && hayWhatsapp() && (
                    <a
                      href={urlWhatsapp(
                        `Hola, soy ${d.nombre.trim()}. Quise confirmar en la invitación pero no encontré mi nombre en la lista.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => medir("clic_whatsapp", { origen: "rsvp_no_esta" })}
                      className="mt-1 block font-semibold underline underline-offset-4"
                    >
                      Escríbenos por WhatsApp
                    </a>
                  )}
                </motion.p>
              )}
            </AnimatePresence>

            {formularioAbierto && (
            <>

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
                  {maxAcompanantes > 0 && (
                  <Campo etiqueta={invitado ? "¿Cuántos asisten?" : "Acompañantes"} htmlFor="acompanantes">
                    <Contador
                      valor={d.acompanantes}
                      max={maxAcompanantes}
                      contarTitular={!!invitado}
                      // Suma sobre el valor más reciente: dos toques rápidos
                      // antes de redibujar contaban como uno.
                      onPaso={(delta) =>
                        setD((prev) => ({
                          ...prev,
                          acompanantes: Math.min(maxAcompanantes, Math.max(0, prev.acompanantes + delta)),
                        }))
                      }
                    />
                  </Campo>
                  )}
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

            <Campo etiqueta="Una canción que no puede faltar" htmlFor="canciones" opcional>
              <input
                id="canciones"
                className="campo"
                value={d.canciones}
                onChange={(e) => set("canciones", e.target.value)}
                placeholder="Canción y artista"
                maxLength={500}
                disabled={cerrado}
              />
            </Campo>

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

            </>
            )}

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
              <button type="submit" disabled={cerrado || estado === "enviando" || buscando} className={boton}>
                {!formularioAbierto
                  ? buscando
                    ? "Buscando…"
                    : "Buscar mi invitación"
                  : estado === "enviando"
                    ? "Enviando…"
                    : "Confirmar asistencia"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── gracias */

function Gracias({
  datos,
  porWhatsapp,
  saludo,
}: {
  datos: Datos;
  porWhatsapp: boolean;
  /** Saludo de la lista ("Familia Pérez"): mejor que el primer nombre. */
  saludo?: string;
}) {
  const asiste = datos.asistencia === "si";
  const pila = datos.nombre.trim().split(/\s+/)[0] || "";
  // "camila" → "Camila": muchos escriben su nombre en minúsculas en el celular.
  const nombrePila = saludo ?? pila.charAt(0).toLocaleUpperCase("es-CL") + pila.slice(1);

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

/**
 * Cuenta acompañantes. Con lista de invitados muestra el total de personas
 * (titular incluido), que es como piensa una familia: "vamos 3 de 4".
 */
function Contador({
  valor,
  max,
  contarTitular,
  onPaso,
}: {
  valor: number;
  max: number;
  contarTitular: boolean;
  onPaso: (delta: number) => void;
}) {
  const mostrado = contarTitular ? valor + 1 : valor;
  const redondo =
    "flex h-10 w-10 items-center justify-center rounded-full border border-linea text-[1.3rem] leading-none text-oliva transition-colors hover:border-oliva disabled:opacity-30";
  return (
    <div className="mt-2 flex items-center gap-5 border-b border-linea pb-3">
      <button type="button" onClick={() => onPaso(-1)} disabled={valor === 0} aria-label="Quitar un acompañante" className={redondo}>
        −
      </button>
      <span className="w-6 text-center font-serif text-[1.8rem] font-semibold leading-none text-oliva-hondo tabular-nums">
        {mostrado}
      </span>
      <button type="button" onClick={() => onPaso(1)} disabled={valor >= max} aria-label="Agregar un acompañante" className={redondo}>
        +
      </button>
      <span className="text-[1rem] italic text-tinta-suave">
        {contarTitular
          ? `de ${max + 1} ${max + 1 === 1 ? "persona" : "personas"}`
          : valor === 0
            ? "Voy solo/a"
            : valor === 1
              ? "1 persona más"
              : `${valor} personas más`}
      </span>
    </div>
  );
}
