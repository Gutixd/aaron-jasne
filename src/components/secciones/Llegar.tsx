import { motion } from "framer-motion";
import { Rombo } from "../Marca";
import { RevelarMascara } from "../Revelar";
import Mapa from "../Mapa";
import { evento, pendiente } from "@/config/event.config";
import { medir } from "@/lib/analytics";

const silk = [0.22, 1, 0.36, 1] as const;

/**
 * Cómo llegar.
 *
 * El mapa usa el modo `place` de Google Maps Embed con una consulta de
 * búsqueda, que no necesita clave de API — así no hay ningún secreto en el
 * cliente. Si más adelante se quiere la Embed API con clave, el sitio
 * correcto es una variable de entorno, nunca este componente.
 *
 * Mientras no haya lugar definido no dibujamos un mapa apuntando a ninguna
 * parte: se muestra el estado de "por confirmar", que es la verdad.
 */
export default function Llegar() {
  const sinLugar = pendiente(evento.lugar.nombre) && pendiente(evento.lugar.consultaMapa);

  const srcMapa = evento.lugar.consultaMapa
    ? `https://www.google.com/maps?q=${encodeURIComponent(evento.lugar.consultaMapa)}&output=embed`
    : null;

  const urlDirecciones = evento.lugar.consultaMapa
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        evento.lugar.consultaMapa,
      )}`
    : evento.lugar.mapsUrl || null;

  return (
    <section id="llegar" className="bg-hueso px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <span className="eyebrow flex items-center gap-3 text-[0.58rem] text-rosa">
              <Rombo tam={7} />
              Ubicación
            </span>

            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,3.8rem)] leading-[0.95]">
              <RevelarMascara>¿Cómo llegar?</RevelarMascara>
            </h2>

            <motion.div
              className="mt-9"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1, delay: 0.2, ease: silk }}
            >
              {sinLugar ? (
                <p className="max-w-sm border-l border-rosa/45 pl-5 text-[0.92rem] leading-[1.95] text-tinta-suave">
                  Todavía estamos cerrando el lugar. En cuanto esté confirmado
                  aparecerá acá con el mapa y las indicaciones para llegar.
                </p>
              ) : (
                <>
                  <p className="font-display text-3xl leading-tight">{evento.lugar.nombre}</p>
                  {evento.lugar.direccion && (
                    <p className="mt-3 text-[0.92rem] leading-[1.9] text-tinta-suave">
                      {evento.lugar.direccion}
                      {evento.lugar.ciudad && <>, {evento.lugar.ciudad}</>}
                    </p>
                  )}
                </>
              )}
            </motion.div>

            {evento.lugar.notas.length > 0 && (
              <ul className="mt-8 space-y-3">
                {evento.lugar.notas.map((nota, i) => (
                  <motion.li
                    key={nota}
                    className="flex items-baseline gap-3 text-[0.85rem] leading-[1.8] text-tinta-suave"
                    initial={{ opacity: 0, x: -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.35 + i * 0.12, ease: silk }}
                  >
                    <span className="shrink-0 translate-y-[0.15rem] text-rosa/70">
                      <Rombo tam={6} />
                    </span>
                    {nota}
                  </motion.li>
                ))}
              </ul>
            )}

            {urlDirecciones && (
              <motion.div
                className="mt-10 flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.35, ease: silk }}
              >
                <a
                  href={urlDirecciones}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => medir("clic_maps", { tipo: "direcciones" })}
                  className="group relative overflow-hidden border border-tinta/20 px-8 py-4 transition-colors duration-500 hover:border-rosa hover:text-hueso"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-rosa transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-y-100" />
                  <span className="eyebrow relative text-[0.55rem]">Cómo llegar</span>
                </a>

                {evento.lugar.mapsUrl && (
                  <a
                    href={evento.lugar.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => medir("clic_maps", { tipo: "abrir" })}
                    className="eyebrow border-b border-tinta/20 pb-1 text-[0.55rem] text-tinta-suave transition-colors hover:border-rosa hover:text-rosa"
                  >
                    Abrir en Google Maps
                  </a>
                )}
              </motion.div>
            )}
          </div>

          {srcMapa ? (
            <Mapa src={srcMapa} />
          ) : (
            <motion.div
              className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-[16/11]"
              initial={{ opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }}
              whileInView={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.5, ease: silk }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-hueso-hondo text-piedra">
                <Rombo tam={18} />
                <span className="eyebrow text-[0.5rem] opacity-70">Lugar por confirmar</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
