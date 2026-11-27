import { Divisor, Flores } from "../Ornamentos";
import Foto from "../Foto";
import Aparecer from "../Aparecer";
import { evento, pendiente } from "@/config/event.config";
import { medir } from "@/lib/analytics";

export default function Lugar() {
  const { lugar, fotos } = evento;
  const sinLugar = pendiente(lugar.nombre);

  return (
    <section id="lugar" className="papel relative overflow-hidden px-6 pb-14 pt-14 text-center">
      <Aparecer>
        <h2 className="titular text-[2.3rem] text-oliva-hondo">Lugar</h2>
        <Divisor className="mt-3 text-oliva" />
      </Aparecer>

      {/* Foto enmarcada: filete fino con margen claro, como una postal. */}
      <Aparecer delay={0.1} className="mx-auto mt-8 max-w-[21rem]">
        <div className="border border-linea bg-papel-claro p-2 shadow-[0_10px_24px_-14px_rgba(58,59,47,0.6)]">
          <Foto src={fotos.lugar} alt={lugar.nombre || "El lugar"} className="aspect-[4/3] w-full" />
        </div>
      </Aparecer>

      <Aparecer delay={0.15} className="relative mt-6">
        {sinLugar ? (
          <p className="text-[1.05rem] italic text-tinta-suave">Lugar por confirmar</p>
        ) : (
          <>
            <p className="manuscrita text-[2.5rem] text-oliva-hondo">{lugar.nombre}</p>
            <p className="mt-1 text-[1.05rem] leading-snug text-tinta">
              {lugar.direccion}
              <br />
              {lugar.ciudad}
            </p>
            {lugar.mapsUrl && (
              <a
                href={lugar.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => medir("clic_maps", { tipo: "abrir" })}
                className="rotulo mt-6 inline-block rounded-sm bg-oliva px-7 py-3 text-[0.72rem] text-papel-claro shadow-[0_6px_14px_-8px_rgba(56,59,42,0.9)] transition-colors hover:bg-oliva-hondo"
              >
                Ver en el mapa
              </a>
            )}
          </>
        )}
        <Flores src={fotos.floresEsquina} className="absolute -bottom-10 -right-12 w-28" espejo />
      </Aparecer>
    </section>
  );
}
