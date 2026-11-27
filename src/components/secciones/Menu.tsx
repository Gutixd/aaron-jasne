import { Divisor, Ramita } from "../Ornamentos";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";

/**
 * Menú de la fiesta, como la carta impresa que queda sobre cada plato:
 * el tiempo en versalitas y el plato en cursiva debajo.
 */
export default function Menu() {
  const { menu } = evento;

  return (
    <section id="menu" className="papel relative px-7 pb-14 pt-12 text-center">
      <Aparecer>
        <h2 className="titular text-[2.2rem] text-oliva-hondo">Menú</h2>
        <p className="manuscrita -mt-1 text-[2.1rem] text-oliva">de la fiesta</p>
        <Divisor className="mt-3 text-oliva" />
      </Aparecer>

      <ul className="mx-auto mt-8 max-w-[19rem] space-y-6">
        {menu.tiempos.map((t, i) => (
          <li key={t.tiempo}>
            <Aparecer delay={i * 0.05}>
              <p className="rotulo text-[0.72rem] text-dorado">{t.tiempo}</p>
              <p className="mt-1.5 text-[1.12rem] leading-snug text-tinta">{t.plato}</p>
              {t.opciones && <p className="mt-1 text-[0.98rem] italic text-tinta-suave">{t.opciones}</p>}
            </Aparecer>
          </li>
        ))}
      </ul>

      <Aparecer delay={0.1}>
        <span className="mt-8 inline-block text-oliva">
          <Ramita />
        </span>
        <p className="mx-auto mt-3 max-w-[17rem] text-[0.98rem] italic text-tinta-suave">{menu.nota}</p>
      </Aparecer>
    </section>
  );
}
