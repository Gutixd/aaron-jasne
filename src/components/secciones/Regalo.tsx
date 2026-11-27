import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Corazon, Divisor } from "../Ornamentos";
import Aparecer from "../Aparecer";
import { evento, pendiente } from "@/config/event.config";
import { useInvitadoDelLink } from "@/lib/invitado";

/**
 * Regalo: datos para transferir (cada uno con su botón Copiar, y uno que
 * copia todo junto, que es como se pega en la app del banco) y un aviso
 * opcional "Ya hice mi regalo" que queda en el panel. La página no toca
 * dinero: la transferencia la hace cada invitado desde su banco.
 */
export default function Regalo() {
  const { texto, transferencia: t } = evento.regalo;
  const faltanDatos = Object.values(t).some((v) => pendiente(v));

  const filas: [string, string][] = [
    ["Titular", t.titular],
    ["RUT", t.rut],
    ["Banco", t.banco],
    ["Tipo de cuenta", t.tipoCuenta],
    ["N° de cuenta", t.numero],
    ["Correo", t.correo],
  ];
  const todo = filas.map(([k, v]) => `${k}: ${v}`).join("\n");

  return (
    <section id="regalo" className="papel relative px-6 pb-14 pt-12 text-center">
      <Aparecer>
        <h2 className="titular text-[2.2rem] text-oliva-hondo">Regalo</h2>
        <Divisor className="mt-3 text-oliva" />
        <p className="mx-auto mt-5 max-w-[18rem] text-[1.05rem] leading-[1.6] text-tinta">{texto}</p>
      </Aparecer>

      <Aparecer delay={0.1} className="mx-auto mt-7 max-w-[21rem]">
        {faltanDatos ? (
          <p className="rounded-sm border border-dashed border-linea px-4 py-5 text-[1rem] italic text-tinta-suave">
            Los datos para transferir estarán aquí muy pronto.
          </p>
        ) : (
          <div className="rounded-sm border border-linea bg-papel-claro/80 px-4 py-4 text-left shadow-[0_10px_24px_-16px_rgba(58,59,47,0.6)]">
            <dl className="divide-y divide-linea/60">
              {filas.map(([k, v]) => (
                <div key={k} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <dt className="rotulo text-[0.6rem] text-tinta-suave">{k}</dt>
                    {/* Cifras "de caja" (1, 11.111.111-1): con las cifras antiguas de
                       Cormorant el RUT se leía "II.III.III-I". */}
                    <dd className="truncate text-[1.05rem] text-tinta [font-variant-numeric:lining-nums_tabular-nums]">{v}</dd>
                  </div>
                  <BotonCopiar valor={v} etiqueta={k} />
                </div>
              ))}
            </dl>
            <div className="mt-3 text-center">
              <BotonCopiar valor={todo} etiqueta="todos los datos" grande />
            </div>
          </div>
        )}
      </Aparecer>

      <AvisoRegalo />
    </section>
  );
}

/* ─────────────────────────────────────────────────────── copiar al portapapeles */

function BotonCopiar({ valor, etiqueta, grande }: { valor: string; etiqueta: string; grande?: boolean }) {
  const [listo, setListo] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // Navegadores antiguos o sin permiso: el método clásico.
      const area = document.createElement("textarea");
      area.value = valor;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setListo(true);
    window.setTimeout(() => setListo(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${etiqueta}`}
      className={`rotulo shrink-0 rounded-sm border transition-colors ${
        grande
          ? "border-oliva bg-oliva px-5 py-3 text-[0.68rem] text-papel-claro hover:bg-oliva-hondo"
          : "border-linea px-3 py-2 text-[0.58rem] text-oliva hover:border-oliva"
      }`}
    >
      {listo ? "¡Copiado!" : grande ? "Copiar todos los datos" : "Copiar"}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── aviso de regalo */

function AvisoRegalo() {
  const invitado = useInvitadoDelLink();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [trampa, setTrampa] = useState("");
  const [estado, setEstado] = useState<"form" | "enviando" | "listo">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invitado) setNombre((n) => n || invitado.nombre);
  }, [invitado]);

  // "50000" → "50.000" mientras escribe.
  const formatear = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 9);
    return d ? Number(d).toLocaleString("es-CL") : "";
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nombre.trim().length < 2) return setError("Escribe tu nombre.");
    setEstado("enviando");
    try {
      const r = await fetch("/api/regalo.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          monto: monto.replace(/\D/g, ""),
          mensaje: mensaje.trim(),
          codigo: invitado?.codigo,
          sitio: trampa,
        }),
      });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!r.ok || !j?.ok) {
        setEstado("form");
        return setError(j?.error ?? "No pudimos guardar tu aviso. Inténtalo de nuevo.");
      }
      setEstado("listo");
    } catch {
      setEstado("form");
      setError("No hay conexión en este momento. Inténtalo de nuevo.");
    }
  };

  const campo =
    "mt-1 w-full border-b border-linea bg-transparent py-2 text-[1.05rem] text-tinta outline-none placeholder:text-tinta-suave/60 focus:border-oliva";

  return (
    <div className="mx-auto mt-8 max-w-[21rem]">
      <AnimatePresence mode="wait" initial={false}>
        {estado === "listo" ? (
          <motion.div key="listo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-block text-oliva">
              <Corazon tam={18} />
            </span>
            <p className="manuscrita mt-2 text-[2.2rem] text-oliva-hondo">¡Muchas gracias!</p>
            <p className="mt-1 text-[1.02rem] text-tinta">Nos llegó tu aviso. Gracias por tu cariño.</p>
          </motion.div>
        ) : !abierto ? (
          <motion.div key="boton" exit={{ opacity: 0 }}>
            <p className="text-[0.98rem] italic text-tinta-suave">¿Ya hiciste tu regalo?</p>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="rotulo mt-3 rounded-sm border border-oliva px-6 py-3 text-[0.68rem] text-oliva transition-colors hover:bg-oliva hover:text-papel-claro"
            >
              Avisar a los novios
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={enviar}
            noValidate
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative text-left"
          >
            <p className="text-center text-[0.98rem] italic text-tinta-suave">
              Así sabemos a quién agradecer. Solo lo vemos nosotros.
            </p>
            <label htmlFor="regalo-nombre" className="rotulo mt-5 block text-[0.62rem] text-tinta-suave">
              Tu nombre
            </label>
            <input id="regalo-nombre" className={campo} value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} />

            <label htmlFor="regalo-monto" className="rotulo mt-5 block text-[0.62rem] text-tinta-suave">
              Monto <span className="font-serif text-[0.8rem] normal-case tracking-normal italic opacity-70">opcional</span>
            </label>
            <div className="flex items-baseline gap-1">
              <span className="text-[1.05rem] text-tinta-suave">$</span>
              <input
                id="regalo-monto"
                inputMode="numeric"
                className={`${campo} [font-variant-numeric:lining-nums]`}
                value={monto}
                onChange={(e) => setMonto(formatear(e.target.value))}
                placeholder="50.000"
              />
            </div>

            <label htmlFor="regalo-mensaje" className="rotulo mt-5 block text-[0.62rem] text-tinta-suave">
              Un mensaje <span className="font-serif text-[0.8rem] normal-case tracking-normal italic opacity-70">opcional</span>
            </label>
            <textarea
              id="regalo-mensaje"
              rows={2}
              maxLength={800}
              className={`${campo} resize-none`}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />

            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trampa}
              onChange={(e) => setTrampa(e.target.value)}
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />

            {error && (
              <p role="alert" className="mt-4 border-l-2 border-dorado pl-3 text-[0.98rem] text-oliva-hondo">
                {error}
              </p>
            )}

            <div className="mt-6 text-center">
              <button
                type="submit"
                disabled={estado === "enviando"}
                className="rotulo rounded-sm bg-oliva px-7 py-3.5 text-[0.72rem] text-papel-claro transition-colors hover:bg-oliva-hondo disabled:opacity-50"
              >
                {estado === "enviando" ? "Enviando…" : "Enviar aviso"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
