import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rombo } from "../Marca";
import { RevelarMascara } from "../Revelar";
import { evento } from "@/config/event.config";
import { medir } from "@/lib/analytics";

const silk = [0.22, 1, 0.36, 1] as const;

/** Alturas del mosaico. Los pesos vienen de la configuración y rompen la reja. */
const alto = { 1: "h-[15rem] sm:h-[19rem]", 2: "h-[21rem] sm:h-[27rem]", 3: "h-[27rem] sm:h-[34rem]" };

export default function Galeria() {
  const fotos = evento.galeria;
  const [abierta, setAbierta] = useState<number | null>(null);
  const [encima, setEncima] = useState<number | null>(null);

  const abrir = (i: number) => {
    setAbierta(i);
    medir("galeria_abierta", { indice: i });
  };

  return (
    <section id="galeria" className="bg-hueso px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Cabecera desalineada a propósito: el título abajo a la derecha
            del rótulo, no uno encima del otro y centrados. */}
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="eyebrow flex items-center gap-3 text-[0.58rem] text-rosa">
              <Rombo tam={7} />
              Nosotros
            </span>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4rem)] leading-none">
              <RevelarMascara>Retratos</RevelarMascara>
            </h2>
          </div>
          <p className="eyebrow max-w-[15rem] text-[0.55rem] leading-[2] text-tinta-suave/70">
            Toca cualquiera para verla completa
          </p>
        </div>

        {/* Columnas de mosaico: cada foto conserva su alto, sin recortes forzados. */}
        <div
          className="columns-2 gap-3 sm:gap-4 lg:columns-3"
          onMouseLeave={() => setEncima(null)}
        >
          {fotos.map((f, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={() => abrir(i)}
              onMouseEnter={() => setEncima(i)}
              aria-label={`Abrir fotografía ${i + 1}`}
              className={`group relative mb-3 block w-full cursor-pointer overflow-hidden sm:mb-4 ${
                alto[f.peso ?? 1]
              }`}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.1, delay: (i % 3) * 0.1, ease: silk }}
              // Las hermanas se apagan cuando una está bajo el cursor.
              animate={{ opacity: encima === null || encima === i ? 1 : 0.45 }}
            >
              {f.src ? (
                <img
                  src={f.src}
                  alt={f.alt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-4 bg-hueso-hondo text-piedra transition-colors duration-500 group-hover:bg-piedra/30">
                  <Rombo tam={14} />
                  <span className="eyebrow text-[0.45rem] opacity-70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
              )}

              {f.caption && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-[linear-gradient(to_top,rgba(11,13,17,0.85),transparent)] px-4 pb-4 pt-10 text-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0">
                  <span className="eyebrow text-[0.5rem] text-hueso">{f.caption}</span>
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <Visor
        indice={abierta}
        total={fotos.length}
        onCerrar={() => setAbierta(null)}
        onIr={(i) => {
          setAbierta(i);
          medir("galeria_navegada", { indice: i });
        }}
      />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────── visor */

function Visor({
  indice,
  total,
  onCerrar,
  onIr,
}: {
  indice: number | null;
  total: number;
  onCerrar: () => void;
  onIr: (i: number) => void;
}) {
  const abierto = indice !== null;

  const anterior = useCallback(() => {
    if (indice !== null) onIr((indice - 1 + total) % total);
  }, [indice, total, onIr]);

  const siguiente = useCallback(() => {
    if (indice !== null) onIr((indice + 1) % total);
  }, [indice, total, onIr]);

  // Teclado: flechas para navegar, Escape para salir.
  useEffect(() => {
    if (!abierto) return;

    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") siguiente();
    };

    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto, onCerrar, anterior, siguiente]);

  const foto = indice !== null ? evento.galeria[indice] : null;

  return (
    <AnimatePresence>
      {abierto && foto && (
        <motion.div
          className="fixed inset-0 z-[95] flex flex-col bg-noche/97 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: silk }}
          role="dialog"
          aria-modal="true"
          aria-label="Visor de fotografías"
        >
          <div className="flex items-center justify-between px-6 py-5 text-hueso sm:px-10">
            <span className="eyebrow text-[0.55rem] text-hueso/50 tabular-nums">
              {String(indice + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="eyebrow cursor-pointer text-[0.55rem] text-hueso/60 transition-colors hover:text-rosa-claro"
            >
              Cerrar ✕
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-4 sm:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={indice}
                className="flex max-h-full max-w-full touch-pan-y items-center justify-center"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.55, ease: silk }}
                // En el teléfono se pasa de foto deslizando, que es el gesto
                // que todos esperan. 60 px o un golpe rápido cuentan.
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -400) siguiente();
                  else if (info.offset.x > 60 || info.velocity.x > 400) anterior();
                }}
              >
                {foto.src ? (
                  <img
                    src={foto.src}
                    alt={foto.alt}
                    draggable={false}
                    className="max-h-[72svh] w-auto max-w-full select-none object-contain"
                  />
                ) : (
                  <span className="flex aspect-[3/4] w-[min(78vw,26rem)] flex-col items-center justify-center gap-6 border border-hueso/12 text-hueso/25">
                    <Rombo tam={22} />
                    <span className="eyebrow text-[0.5rem]">Fotografía pendiente</span>
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            <Flecha lado="izq" onClick={anterior} />
            <Flecha lado="der" onClick={siguiente} />
          </div>

          <div className="px-6 pb-8 text-center sm:px-10">
            {foto.caption && (
              <p className="font-display text-lg italic text-hueso/70">{foto.caption}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Flecha({ lado, onClick }: { lado: "izq" | "der"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "izq" ? "Anterior" : "Siguiente"}
      // Fondo oscuro translúcido: en móvil la flecha queda encima de la foto
      // y con fondo transparente desaparecía sobre cualquier imagen clara.
      className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-hueso/30 bg-noche/55 text-hueso/90 backdrop-blur-sm transition-colors hover:border-rosa hover:bg-rosa hover:text-hueso ${
        lado === "izq" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      }`}
    >
      <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden>
        <path
          d={lado === "izq" ? "M8 1 L1.5 7.5 L8 14" : "M1 1 L7.5 7.5 L1 14"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
    </button>
  );
}
