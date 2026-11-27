import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Divisor } from "../Ornamentos";
import Foto from "../Foto";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";
import { medir } from "@/lib/analytics";

/** Proporciones alternadas: dan el mosaico irregular de la referencia. */
const PROPORCION = ["aspect-[3/4]", "aspect-[4/5]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]", "aspect-square"];

export default function Galeria() {
  const { galeria } = evento;
  const [abierta, setAbierta] = useState<number | null>(null);

  const abrir = (i: number) => {
    setAbierta(i);
    medir("galeria_abierta", { indice: i });
  };

  return (
    <section id="galeria" className="papel relative overflow-hidden px-5 pb-14 pt-6 text-center">
      <Aparecer>
        <h2 className="titular text-[2.3rem] text-oliva-hondo">Galería</h2>
        <Divisor className="mt-3 text-oliva" />
      </Aparecer>

      <div className="mx-auto mt-8 max-w-[24rem] columns-2 gap-2.5">
        {galeria.map((f, i) => (
          <Aparecer key={f.src} delay={(i % 2) * 0.08} className="mb-2.5 break-inside-avoid">
            <button
              type="button"
              onClick={() => abrir(i)}
              aria-label={`Ver foto ${i + 1}`}
              className="block w-full overflow-hidden shadow-[0_8px_18px_-12px_rgba(58,59,47,0.7)]"
            >
              <Foto src={f.src} alt={f.alt} className={`${PROPORCION[i % PROPORCION.length]} w-full`} />
            </button>
          </Aparecer>
        ))}
      </div>

      <Aparecer>
        <button
          type="button"
          onClick={() => abrir(0)}
          className="rotulo mt-6 rounded-sm bg-oliva px-7 py-3 text-[0.72rem] text-papel-claro shadow-[0_6px_14px_-8px_rgba(56,59,42,0.9)] transition-colors hover:bg-oliva-hondo"
        >
          Ver todas las fotos
        </button>
      </Aparecer>

      <Visor indice={abierta} onCerrar={() => setAbierta(null)} onIr={setAbierta} />
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────── visor */

function Visor({
  indice,
  onCerrar,
  onIr,
}: {
  indice: number | null;
  onCerrar: () => void;
  onIr: (i: number) => void;
}) {
  const total = evento.galeria.length;
  const abierto = indice !== null;

  const mover = useCallback(
    (d: number) => indice !== null && onIr((indice + d + total) % total),
    [indice, onIr, total],
  );

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowLeft") mover(-1);
      if (e.key === "ArrowRight") mover(1);
    };
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto, onCerrar, mover]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col bg-oliva-hondo/97"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Fotos"
        >
          <div className="flex items-center justify-between px-5 py-4 text-papel-claro">
            <span className="rotulo text-[0.68rem] tabular-nums opacity-70">
              {indice + 1} / {total}
            </span>
            <button type="button" onClick={onCerrar} className="rotulo text-[0.68rem] opacity-80">
              Cerrar ✕
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={indice}
                className="w-full max-w-[26rem] touch-pan-y"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.35}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60 || info.velocity.x < -400) mover(1);
                  else if (info.offset.x > 60 || info.velocity.x > 400) mover(-1);
                }}
              >
                <Foto
                  src={evento.galeria[indice].src}
                  alt={evento.galeria[indice].alt}
                  className="max-h-[75svh] w-full object-contain"
                  oscuro
                />
              </motion.div>
            </AnimatePresence>

            {(["izq", "der"] as const).map((lado) => (
              <button
                key={lado}
                type="button"
                onClick={() => mover(lado === "izq" ? -1 : 1)}
                aria-label={lado === "izq" ? "Anterior" : "Siguiente"}
                className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-papel-claro/40 bg-oliva-hondo/60 text-papel-claro ${
                  lado === "izq" ? "left-2" : "right-2"
                }`}
              >
                {lado === "izq" ? "‹" : "›"}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
