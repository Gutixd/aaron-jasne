import Aparecer from "../Aparecer";
import { Flores } from "../Ornamentos";
import { evento } from "@/config/event.config";

export default function Cita() {
  const { cita, fotos } = evento;

  return (
    <section className="papel relative overflow-hidden px-8 pb-6 pt-12 text-center">
      <Aparecer>
        <span aria-hidden className="block font-serif text-[4rem] leading-[0.6] text-oliva">
          “
        </span>
        <blockquote className="mx-auto mt-4 max-w-[17rem] text-[1.15rem] leading-[1.55] text-tinta">
          {cita.texto}
        </blockquote>
        <p className="rotulo mt-4 text-[0.66rem] text-tinta-suave">{cita.autor}</p>
      </Aparecer>
      <div className="mt-4 flex items-end justify-between">
        <Flores src={fotos.floresEsquina} className="-ml-10 w-24" />
        <Flores src={fotos.floresEsquina} className="-mr-10 w-24" espejo />
      </div>
    </section>
  );
}
