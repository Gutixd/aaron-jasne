import { Corazon } from "../Ornamentos";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";
import { descargarIcs, urlGoogleCalendar } from "@/lib/calendar";
import { medir } from "@/lib/analytics";
import { useCuentaRegresiva } from "@/hooks";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Día, mes y año del evento en hora de Chile, sin depender del huso del invitado. */
function partesChile(iso: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>((a, x) => ((a[x.type] = x.value), a), {});
  return { anio: +p.year, mes: +p.month - 1, dia: +p.day };
}

export default function Fecha() {
  const { anio, mes, dia } = partesChile(evento.fecha.iso);
  const confirmada = evento.fecha.confirmada;
  const t = useCuentaRegresiva(evento.fecha.iso);

  // Calendario del mes, con la semana empezando en lunes.
  const primero = new Date(Date.UTC(anio, mes, 1)).getUTCDay(); // 0 = domingo
  const desfase = (primero + 6) % 7;
  const diasMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  const celdas: (number | null)[] = [
    ...Array<null>(desfase).fill(null),
    ...Array.from({ length: diasMes }, (_, i) => i + 1),
  ];
  const diaSemana = SEMANA[new Date(Date.UTC(anio, mes, dia)).getUTCDay()];
  // Ceremonia: la hora del evento, en hora de Chile. Llegada: el primer
  // momento del programa, si es una hora (ej. 15:30); si no, la ceremonia.
  const ceremonia = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(evento.fecha.iso));
  const primera = evento.programa[0]?.hora ?? "";
  const llegada = /^\d{1,2}:\d{2}$/.test(primera) ? primera : ceremonia;

  return (
    <section id="fecha" className="papel px-6 pb-14 text-center">
      <Aparecer>
        <p className="rotulo text-[0.8rem] text-dorado">Guarda la fecha</p>

        <p className="mt-3 font-serif text-[clamp(2.4rem,11vw,3rem)] font-medium tracking-[0.06em] text-oliva-hondo tabular-nums">
          {String(dia).padStart(2, "0")} . {String(mes + 1).padStart(2, "0")} . {anio}
        </p>
        <p className="rotulo mt-1 text-[0.78rem] text-tinta">
          {diaSemana}
          {confirmada && llegada && <> · {llegada} hrs</>}
        </p>
        {/* La hora de llegada es lo que más importa para no atrasarse; la
            de la ceremonia va debajo, más chica. */}
        {confirmada && llegada && ceremonia && llegada !== ceremonia && (
          <p className="mt-1 text-[0.98rem] italic text-tinta-suave">Ceremonia a las {ceremonia}</p>
        )}

        {!confirmada && (
          <p className="mx-auto mt-2 max-w-[17rem] text-[0.92rem] italic text-tinta-suave">
            Fecha estimada: el día exacto de {MESES[mes]} está por confirmar.
          </p>
        )}
      </Aparecer>

      <Aparecer delay={0.1} className="mx-auto mt-7 max-w-[19rem]">
        <p className="rotulo mb-3 text-[0.7rem] text-tinta-suave">
          {MESES[mes]} {anio}
        </p>
        <div className="grid grid-cols-7 gap-y-1.5 text-[0.95rem]">
          {DIAS.map((d) => (
            <span key={d} className="rotulo pb-1 text-[0.58rem] tracking-[0.12em] text-tinta-suave">
              {d}
            </span>
          ))}
          {celdas.map((n, i) =>
            n === dia ? (
              <span key={i} className="relative flex h-8 items-center justify-center">
                <span className="absolute text-oliva">
                  <Corazon tam={30} />
                </span>
                <span className="relative text-[0.85rem] font-semibold text-papel-claro">{n}</span>
              </span>
            ) : (
              <span key={i} className="flex h-8 items-center justify-center text-tinta">
                {n ?? ""}
              </span>
            ),
          )}
        </div>
      </Aparecer>

      {t && !t.llego && (
        <Aparecer delay={0.15}>
          <p className="mt-6 text-[1.05rem] italic text-tinta-suave">
            Faltan <span className="not-italic font-semibold text-oliva">{t.dias}</span> días
          </p>
        </Aparecer>
      )}

      <Aparecer delay={0.2} className="mt-6 flex flex-col items-center gap-3">
        <a
          href={urlGoogleCalendar()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => medir("clic_calendario", { destino: "google" })}
          className="rotulo rounded-sm bg-oliva px-6 py-3 text-[0.7rem] text-papel-claro shadow-[0_6px_14px_-8px_rgba(56,59,42,0.9)] transition-colors hover:bg-oliva-hondo"
        >
          Agendar en mi calendario
        </a>
        <button
          type="button"
          onClick={() => {
            descargarIcs();
            medir("clic_calendario", { destino: "ics" });
          }}
          className="text-[0.92rem] italic text-tinta-suave underline decoration-linea underline-offset-4"
        >
          Descargar para iPhone u Outlook
        </button>
      </Aparecer>
    </section>
  );
}
