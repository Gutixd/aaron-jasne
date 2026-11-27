import { BandaOliva, Corazon } from "../Ornamentos";
import Foto from "../Foto";
import Aparecer from "../Aparecer";
import { evento, textoFecha } from "@/config/event.config";

/** Cierre: foto con "¡Gracias!" manuscrito encima, sobre la banda oliva. */
export default function Cierre() {
  const { pareja, fotos } = evento;

  return (
    <footer>
      <BandaOliva abajo={false}>
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Foto src={fotos.cierre} alt={`${pareja.uno} y ${pareja.dos}`} className="h-full w-full" oscuro />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-oliva-hondo/95 via-oliva-hondo/25 to-oliva/60"
          />
          <Aparecer className="absolute inset-x-0 bottom-10 px-6 text-center text-papel-claro">
            <p className="manuscrita text-[3.6rem] leading-none">¡Gracias!</p>
            <p className="mx-auto mt-3 max-w-[15rem] text-[1.05rem] leading-snug text-papel-claro/90">
              No vemos la hora de celebrar contigo.
            </p>
          </Aparecer>
        </div>

        <div className="px-6 pb-10 pt-6 text-center text-papel-claro/70">
          <p className="titular flex items-center justify-center gap-2 text-[1.4rem] text-dorado-claro">
            {pareja.monograma.a}
            <Corazon tam={9} />
            {pareja.monograma.b}
          </p>
          <p className="rotulo mt-2 text-[0.62rem]">{textoFecha()}</p>
        </div>
      </BandaOliva>
    </footer>
  );
}
