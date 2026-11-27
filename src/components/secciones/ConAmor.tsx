import { BandaOliva, BordeRasgado, Corazon } from "../Ornamentos";
import Foto from "../Foto";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";

/** Banda oliva rasgada: "Con amor, Aaron & Jasne" sobre una foto que se funde. */
export default function ConAmor() {
  const { pareja, fotos } = evento;

  return (
    <section>
      <BandaOliva abajo={false} className="px-6 text-center text-papel-claro">
        <Aparecer className="relative z-10 pt-6">
          <p className="manuscrita text-[2.1rem] text-papel-claro/90">Con amor</p>
          <p className="titular mt-1 text-[2.4rem] text-dorado-claro">{pareja.uno}</p>
          <p className="manuscrita text-[2rem] leading-none text-dorado-claro">&amp;</p>
          <p className="titular text-[2.4rem] text-dorado-claro">{pareja.dos}</p>
          <span className="mt-3 inline-block text-dorado-claro">
            <Corazon tam={10} />
          </span>
        </Aparecer>

        {/* La foto se funde hacia arriba con el oliva. */}
        <div className="relative -mx-6 mt-4 aspect-[4/3]">
          <Foto src={fotos.conAmor} alt="Aaron y Jasne" className="h-full w-full" oscuro />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-oliva to-transparent"
          />
          {/* El papel crema de la sección siguiente entra rasgado sobre la foto. */}
          <BordeRasgado lado="arriba" fondo="papel" className="absolute inset-x-0 -bottom-px" />
        </div>
      </BandaOliva>
    </section>
  );
}
