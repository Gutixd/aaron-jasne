import { Corazon, Divisor } from "./Ornamentos";
import { evento, textoFecha } from "@/config/event.config";
import { useCuentaRegresiva } from "@/hooks";

/**
 * Solo en pantallas anchas (≥ 1280 px): a los lados de la columna de la
 * invitación, un índice para saltar entre secciones y la cuenta regresiva
 * con el botón de confirmar. En el celular no existe; ahí la invitación es
 * la columna sola, como está pensada.
 */
const indice: [string, string][] = [
  ["inicio", "Inicio"],
  ["fecha", "La fecha"],
  ["programa", "Programa"],
  ["menu", "Menú"],
  ["vestimenta", "Dress code"],
  ["regalo", "Regalo"],
  ["lugar", "Lugar"],
  ["galeria", "Galería"],
  ["confirmar", "Confirmar"],
];

const ir = (id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// La columna mide 30rem: cada panel va a 4rem de su borde.
const lado = "pointer-events-auto fixed top-1/2 hidden w-[13rem] -translate-y-1/2 text-center text-papel-claro xl:block";

export default function LateralesEscritorio() {
  const t = useCuentaRegresiva(evento.fecha.iso);
  const { pareja } = evento;

  return (
    <>
      <nav aria-label="Secciones" className={`${lado} right-[calc(50%+19rem)]`}>
        <p className="titular text-[1.6rem] tracking-[0.12em]">
          {pareja.uno[0]} <span className="text-dorado-claro">&amp;</span> {pareja.dos[0]}
        </p>
        <Divisor className="mt-2 text-dorado-claro" ancho="2.2rem" />
        <ul className="mt-6 space-y-3">
          {indice.map(([id, texto]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={ir(id)}
                className="rotulo text-[0.68rem] text-papel-claro/70 transition-colors hover:text-dorado-claro"
              >
                {texto}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <aside className={`${lado} left-[calc(50%+19rem)]`}>
        <p className="rotulo text-[0.66rem] text-papel-claro/70">{textoFecha()}</p>
        {t && !t.llego && (
          <>
            <p className="titular mt-4 text-[3.4rem] leading-none text-papel-claro tabular-nums">{t.dias}</p>
            <p className="manuscrita mt-1 text-[1.7rem] text-dorado-claro">{t.dias === 1 ? "día" : "días"}</p>
          </>
        )}
        <span className="mt-4 inline-block text-dorado-claro">
          <Corazon tam={10} />
        </span>
        <p className="mt-3 text-[1rem] italic text-papel-claro/80">
          {evento.rsvp.cierreTexto ? `Confirma antes del ${evento.rsvp.cierreTexto}` : "Confirma tu asistencia"}
        </p>
        <a
          href="#confirmar"
          onClick={ir("confirmar")}
          className="rotulo mt-5 inline-block rounded-sm bg-papel-claro px-6 py-3 text-[0.68rem] text-oliva-hondo transition-colors hover:bg-dorado-claro"
        >
          Confirmar
        </a>
      </aside>
    </>
  );
}
