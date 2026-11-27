import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { evento } from "@/config/event.config";
import { medir } from "@/lib/analytics";
import { useMovimientoReducido } from "@/hooks";

/**
 * Reproductor flotante.
 *
 * Los navegadores no dejan sonar audio sin un gesto previo del usuario, así
 * que la reproducción arranca en el clic de "Entrar a nuestra historia" y no
 * antes. Si aun así el navegador la rechaza, el botón se queda en pausa sin
 * romper nada — nunca damos por hecho que sonó.
 *
 * El archivo se cambia desde `evento.musica.src`; no hay rutas de audio
 * repartidas por los componentes.
 */
export default function Musica({ arrancar }: { arrancar: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sonando, setSonando] = useState(false);
  const [disponible, setDisponible] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [volumen, setVolumen] = useState(0.55);
  const reducido = useMovimientoReducido();

  useEffect(() => {
    const a = audioRef.current;
    if (a) a.volume = volumen;
  }, [volumen]);

  // Primer intento de reproducción, atado al gesto de entrada.
  useEffect(() => {
    if (!arrancar) return;
    const a = audioRef.current;
    if (!a) return;

    a.volume = 0;
    a.play()
      .then(() => {
        setSonando(true);
        medir("musica_play");
        // Entrada suave: subir el volumen de golpe es agresivo.
        const objetivo = volumen;
        const inicio = performance.now();
        const subir = (t: number) => {
          const p = Math.min(1, (t - inicio) / 2600);
          a.volume = objetivo * p;
          if (p < 1) requestAnimationFrame(subir);
        };
        requestAnimationFrame(subir);
      })
      .catch(() => setSonando(false));
    // volumen se lee una sola vez a propósito: es el valor con el que entra.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrancar]);

  const alternar = () => {
    const a = audioRef.current;
    if (!a) return;

    if (sonando) {
      a.pause();
      setSonando(false);
      medir("musica_pause");
    } else {
      a.play()
        .then(() => {
          setSonando(true);
          medir("musica_play");
        })
        .catch(() => setDisponible(false));
    }
  };

  // Sin pista configurada no mostramos un control que no hace nada.
  if (!evento.musica.src || !disponible) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[70] flex items-center gap-3 sm:bottom-8 sm:right-8"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <audio
        ref={audioRef}
        src={evento.musica.src}
        loop
        preload="none"
        onError={() => setDisponible(false)}
      />

      {/* Título de la pista y volumen: aparecen al acercarse, no ocupan
          espacio permanente. */}
      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, x: 14, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: 14, width: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="hidden overflow-hidden whitespace-nowrap rounded-full bg-oliva-hondo/90 px-5 py-3 backdrop-blur-sm sm:block"
          >
            {evento.musica.titulo ? (
              <p className="rotulo text-[0.62rem] text-papel-claro/80">
                {evento.musica.titulo}
                {evento.musica.artista && ` · ${evento.musica.artista}`}
              </p>
            ) : (
              <p className="rotulo text-[0.62rem] text-papel-claro/60">Música</p>
            )}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volumen}
              onChange={(e) => setVolumen(Number(e.target.value))}
              aria-label="Volumen"
              className="mt-2 h-[3px] w-28 cursor-pointer appearance-none rounded bg-papel-claro/25 accent-[#b39558]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? "Pausar música" : "Reproducir música"}
        aria-pressed={sonando}
        // El borde claro lo separa del fondo en las secciones oscuras, donde
        // un botón negro sobre negro prácticamente desaparecía.
        className="relative flex h-13 w-13 cursor-pointer items-center justify-center rounded-full border border-papel-claro/40 bg-oliva text-papel-claro shadow-[0_10px_24px_-8px_rgba(40,42,30,0.7)] transition-colors hover:bg-oliva-hondo"
        style={{ width: 52, height: 52 }}
      >
        {/* Ondas que salen del botón mientras suena. */}
        {sonando && !reducido && (
          <>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-dorado-claro/60"
                animate={{ scale: [1, 1.75], opacity: [0.6, 0] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  delay: i * 1.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}

        {sonando ? <IconoOnda /> : <IconoPlay />}
      </button>
    </div>
  );
}

/** Barras que bailan: se lee como "sonando" sin necesidad de texto. */
function IconoOnda() {
  const reducido = useMovimientoReducido();
  const alturas = [7, 13, 9, 15, 8];

  return (
    <span className="relative flex items-end gap-[3px]" aria-hidden>
      {alturas.map((h, i) => (
        <motion.span
          key={i}
          className="block w-[2px] rounded-full bg-current"
          style={{ height: h }}
          animate={reducido ? undefined : { scaleY: [0.45, 1, 0.45] }}
          transition={{
            duration: 0.9 + i * 0.16,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

function IconoPlay() {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" aria-hidden>
      <path d="M1 1 L12 7.5 L1 14 Z" fill="currentColor" />
    </svg>
  );
}
