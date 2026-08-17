import { motion } from "framer-motion";
import { useInvitados, resumir, fechaCorta } from "./datos";
import { evento } from "@/config/event.config";
import { useCuentaRegresiva } from "@/hooks";

export default function Resumen() {
  const { filas, cargando, error } = useInvitados();
  const r = resumir(filas);
  const t = useCuentaRegresiva(evento.fecha.iso);

  if (cargando) return <Esqueleto />;
  if (error) return <p className="text-[0.85rem] text-rosa">No pudimos cargar: {error}</p>;

  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-display text-4xl leading-none">Resumen</h1>
        <p className="mt-3 text-[0.85rem] text-tinta-suave">
          {evento.fecha.confirmada ? evento.fecha.larga : `${evento.fecha.aproximada} · fecha por confirmar`}
          {t && !t.llego && ` · faltan ${t.dias} días`}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-px overflow-hidden border border-piedra/70 bg-piedra/70 sm:grid-cols-3 lg:grid-cols-5">
        <Cifra valor={r.personas} etiqueta="Personas confirmadas" destacada />
        <Cifra valor={r.confirmados} etiqueta="Dijeron que sí" />
        <Cifra valor={r.acompanantes} etiqueta="Acompañantes" />
        <Cifra valor={r.rechazan} etiqueta="No asistirán" />
        <Cifra valor={`${r.tasa}%`} etiqueta="Tasa de sí" />
      </section>

      {r.respuestas > 0 ? (
        <section className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="eyebrow text-[0.5rem] text-tinta-suave">Reparto de respuestas</h2>
            <Barras si={r.confirmados} no={r.rechazan} />
          </div>

          <div>
            <h2 className="eyebrow text-[0.5rem] text-tinta-suave">Últimas respuestas</h2>
            <ul className="mt-6 divide-y divide-piedra/60 border-y border-piedra/60">
              {filas.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-baseline justify-between gap-4 py-3.5">
                  <span className="text-[0.9rem]">{f.nombre}</span>
                  <span className="flex items-baseline gap-4">
                    <span
                      className={`eyebrow text-[0.45rem] ${
                        f.asistencia ? "text-rosa" : "text-tinta-suave/50"
                      }`}
                    >
                      {f.asistencia
                        ? f.acompanantes
                          ? `Sí · +${f.acompanantes}`
                          : "Sí"
                        : "No"}
                    </span>
                    <span className="text-[0.7rem] tabular-nums text-tinta-suave/45">
                      {fechaCorta(f.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <Vacio />
      )}

      {r.conRestriccion.length > 0 && (
        <section>
          <h2 className="eyebrow text-[0.5rem] text-tinta-suave">
            Restricciones alimentarias ({r.conRestriccion.length})
          </h2>
          <ul className="mt-6 space-y-2.5 border-l border-rosa/40 pl-5">
            {r.conRestriccion.map((f) => (
              <li key={f.id} className="text-[0.88rem]">
                <span>{f.nombre}</span>
                <span className="text-tinta-suave"> — {f.alimentacion}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Cifra({
  valor,
  etiqueta,
  destacada,
}: {
  valor: number | string;
  etiqueta: string;
  destacada?: boolean;
}) {
  return (
    <div className={`px-5 py-8 text-center ${destacada ? "bg-noche text-hueso" : "bg-hueso"}`}>
      <p
        className={`font-display text-4xl leading-none tabular-nums ${
          destacada ? "text-hueso" : "text-tinta"
        }`}
      >
        {valor}
      </p>
      <p
        className={`eyebrow mt-3 text-[0.42rem] ${
          destacada ? "text-hueso/50" : "text-tinta-suave/70"
        }`}
      >
        {etiqueta}
      </p>
    </div>
  );
}

/**
 * Gráfico propio en dos barras. Una librería de charts habría traído 40 kB
 * y un aspecto de dashboard genérico; esto son dos divs que se animan y
 * encajan con el resto de la pieza.
 */
function Barras({ si, no }: { si: number; no: number }) {
  const total = si + no || 1;
  const datos = [
    { etiqueta: "Asisten", valor: si, color: "bg-rosa" },
    { etiqueta: "No asisten", valor: no, color: "bg-piedra" },
  ];

  return (
    <div className="mt-6 space-y-6">
      {datos.map((d, i) => (
        <div key={d.etiqueta}>
          <div className="flex items-baseline justify-between">
            <span className="eyebrow text-[0.45rem] text-tinta-suave">{d.etiqueta}</span>
            <span className="font-display text-lg tabular-nums">{d.valor}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden bg-piedra/40">
            <motion.div
              className={`h-full ${d.color}`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: d.valor / total }}
              style={{ originX: 0 }}
              transition={{ duration: 1.1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Vacio() {
  return (
    <div className="border border-dashed border-piedra px-8 py-16 text-center">
      <p className="font-display text-2xl text-tinta-suave">Todavía no hay respuestas</p>
      <p className="mx-auto mt-4 max-w-xs text-[0.85rem] leading-[1.9] text-tinta-suave/70">
        En cuanto alguien confirme desde la invitación, aparecerá acá.
      </p>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="space-y-10">
      <div className="h-10 w-48 animate-pulse bg-piedra/50" />
      <div className="grid grid-cols-2 gap-px bg-piedra/50 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse bg-hueso-hondo" />
        ))}
      </div>
    </div>
  );
}
