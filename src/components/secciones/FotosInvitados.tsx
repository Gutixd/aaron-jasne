import { useEffect, useRef, useState } from "react";
import { BandaOliva, Divisor } from "../Ornamentos";
import IconoPrograma from "../Iconos";
import Aparecer from "../Aparecer";
import { useInvitadoDelLink } from "@/lib/invitado";

const API = "/api/fotos.php";
/** Fotos por tanda: más que eso satura la conexión de un celular en la fiesta. */
const MAX_POR_TANDA = 20;
/** Lado mayor tras achicar: nítida en pantalla e impresa, y ~10 veces más liviana. */
const LADO_MAX = 2400;

/**
 * Identificador al azar de este celular, guardado en su navegador. Sirve
 * para que el límite de fotos por hora sea por persona y no por Wi-Fi.
 */
function idDispositivo(): string {
  try {
    let id = localStorage.getItem("aj-dispositivo");
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
      localStorage.setItem("aj-dispositivo", id);
    }
    return id;
  } catch {
    return "sin-id";
  }
}

type Estado ="cargando" | "antes" | "abierto" | "cerrado" | "sin_servidor";
/** `pct`: avance del archivo que se está subiendo (0–100). */
type Progreso = { total: number; listas: number; fallidas: number; error: string | null; pct?: number };

/**
 * Sube con XMLHttpRequest y no con fetch: fetch no informa el avance de la
 * subida, y un video de 100 MB tarda minutos. Sin una barra que se mueva,
 * la gente cree que se colgó y cierra la página.
 */
function enviar(
  cuerpo: FormData,
  alAvanzar: (pct: number) => void,
): Promise<{ status: number; json: { ok?: boolean; error?: string } | null }> {
  return new Promise((ok, mal) => {
    const x = new XMLHttpRequest();
    x.open("POST", API);
    x.upload.onprogress = (e) => e.lengthComputable && alAvanzar(Math.round((e.loaded / e.total) * 100));
    x.onload = () => {
      let json = null;
      try {
        json = JSON.parse(x.responseText);
      } catch {
        // respuesta no JSON (p. ej. error del servidor): se informa abajo.
      }
      ok({ status: x.status, json });
    };
    x.onerror = () => mal(new Error("red"));
    x.send(cuerpo);
  });
}

/**
 * Achica la foto en el celular antes de subirla: de 5–8 MB pasa a ~0,5 MB.
 * Si el navegador no puede leerla (HEIC fuera de Safari), se sube tal cual
 * y el servidor aplica su propio límite de tamaño.
 */
async function achicar(archivo: File): Promise<Blob> {
  try {
    const img = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(img.width * escala);
    lienzo.height = Math.round(img.height * escala);
    lienzo.getContext("2d")!.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    img.close();
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
    return blob && blob.size < archivo.size ? blob : archivo;
  } catch {
    return archivo;
  }
}

/**
 * "Comparte tus fotos": el día de la boda los invitados suben sus fotos
 * desde el celular, sin cuenta ni contraseña. Antes de ese día la sección
 * avisa que se abrirá; después, agradece. Las fechas las decide el servidor.
 */
export default function FotosInvitados() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [autor, setAutor] = useState("");
  const [prog, setProg] = useState<Progreso | null>(null);
  // Dos álbumes: todo lo de la fiesta, o solo las favoritas. El QR de
  // favoritas abre la invitación en …#favoritas y ya llega elegido.
  const [album, setAlbum] = useState<"general" | "favoritas">(() =>
    typeof window !== "undefined" && window.location.hash === "#favoritas" ? "favoritas" : "general",
  );
  const entrada = useRef<HTMLInputElement>(null);
  const invitado = useInvitadoDelLink();

  // Tope de cada video que acepta el servidor (lo menor entre lo
  // configurado y el límite de PHP del hosting).
  const [maxVideoMb, setMaxVideoMb] = useState(100);

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((j: { estado?: Estado; max_video_mb?: number }) => {
        setEstado(j.estado ?? "sin_servidor");
        if (j.max_video_mb) setMaxVideoMb(j.max_video_mb);
      })
      .catch(() => setEstado("sin_servidor"));
  }, []);

  useEffect(() => {
    if (invitado) setAutor((a) => a || invitado.nombre);
  }, [invitado]);

  // Sin servidor (por ejemplo, viendo solo el diseño) la sección no aparece.
  if (estado === "cargando" || estado === "sin_servidor") return null;

  const subiendo = prog !== null && prog.listas + prog.fallidas < prog.total;

  const subir = async (lista: FileList | null) => {
    if (!lista?.length) return;
    const archivos = Array.from(lista).slice(0, MAX_POR_TANDA);
    const p: Progreso = { total: archivos.length, listas: 0, fallidas: 0, error: null };
    setProg({ ...p });

    // De a una: si se corta la señal, solo se pierde ese archivo.
    for (const a of archivos) {
      try {
        const esVideo = a.type.startsWith("video/");
        // Un video demasiado grande se descarta aquí, sin gastar datos en subirlo.
        if (esVideo && a.size > maxVideoMb * 1048576) {
          p.fallidas++;
          p.error = `Un video pesa más de ${maxVideoMb} MB. Prueba con uno más corto (1 minuto aprox.).`;
          setProg({ ...p });
          continue;
        }
        const cuerpo = new FormData();
        // Las fotos se achican en el celular; los videos van tal cual.
        const blob = esVideo ? a : await achicar(a);
        cuerpo.append("foto", blob, blob === a ? a.name : "foto.jpg");
        if (autor.trim()) cuerpo.append("autor", autor.trim());
        cuerpo.append("dispositivo", idDispositivo());
        cuerpo.append("album", album);
        const r = await enviar(cuerpo, (pct) => setProg({ ...p, pct }));
        if (r.status >= 200 && r.status < 300 && r.json?.ok) p.listas++;
        else {
          p.fallidas++;
          p.error = r.json?.error ?? (esVideo ? "Un video no se pudo subir." : "Una foto no se pudo subir.");
          // Límite por hora o subida cerrada: no tiene sentido seguir.
          // (Con 507 —espacio lleno— sí: puede que solo esté lleno el de videos.)
          if (r.status === 429 || r.status === 403) {
            p.fallidas += p.total - p.listas - p.fallidas;
          }
        }
      } catch {
        p.fallidas++;
        p.error = "Se cortó la conexión. Revisa tu señal e inténtalo de nuevo.";
      }
      setProg({ ...p });
      if (p.listas + p.fallidas >= p.total) break;
    }
    if (entrada.current) entrada.current.value = "";
  };

  return (
    <section id="fotos">
      {/* Ancla del link/QR de favoritas: …/#favoritas baja hasta aquí. */}
      <span id="favoritas" className="block" aria-hidden />
      <BandaOliva className="px-7 text-center text-papel-claro">
        <div className="py-10">
          <Aparecer>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-dorado-claro/60 text-dorado-claro">
              <IconoPrograma nombre="camara" tam={28} />
            </span>
            <h2 className="titular mt-4 text-[1.9rem] text-papel-claro">Comparte</h2>
            <p className="manuscrita -mt-1 text-[2rem] text-dorado-claro">tus fotos</p>
            <Divisor className="mt-2 text-dorado-claro" ancho="3rem" />
          </Aparecer>

          {estado === "antes" && (
            <p className="mx-auto mt-6 max-w-[17rem] text-[1.05rem] leading-[1.6] text-papel-claro/90">
              El día de la boda, aquí vas a poder subir las fotos que tomes. Queremos ver la fiesta a través de tus ojos.
            </p>
          )}

          {estado === "cerrado" && (
            <p className="mx-auto mt-6 max-w-[17rem] text-[1.05rem] leading-[1.6] text-papel-claro/90">
              Ya cerramos la subida de fotos. ¡Gracias a todos por compartir sus recuerdos con nosotros!
            </p>
          )}

          {estado === "abierto" && (
            <div className="mx-auto mt-6 max-w-[18rem]">
              <div className="mb-5 grid grid-cols-2 gap-1 rounded-sm border border-papel-claro/30 p-1" role="tablist" aria-label="Álbum">
                {(
                  [
                    ["general", "Todas"],
                    ["favoritas", "★ Favoritas"],
                  ] as const
                ).map(([k, txt]) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={album === k}
                    disabled={subiendo}
                    onClick={() => setAlbum(k)}
                    className={`rotulo rounded-sm py-2.5 text-[0.66rem] transition-colors ${
                      album === k ? "bg-papel-claro text-oliva-hondo" : "text-papel-claro/80"
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
              <p className="text-[1.05rem] leading-[1.6] text-papel-claro/90">
                {album === "favoritas"
                  ? "Solo tus fotos y videos más lindos del día: los que no te puedes guardar para ti. ❤"
                  : "Sube las fotos y videos que tomaste hoy. Les llegan directo a los novios, nadie más los ve."}
              </p>
              <p className="mt-2 text-[0.92rem] italic text-papel-claro/70">
                Videos cortos: hasta {maxVideoMb} MB (1 minuto aprox.).
              </p>

              <label htmlFor="autor-fotos" className="rotulo mt-6 block text-left text-[0.64rem] text-papel-claro/70">
                Tu nombre <span className="font-serif text-[0.8rem] normal-case tracking-normal italic">opcional</span>
              </label>
              <input
                id="autor-fotos"
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                maxLength={80}
                placeholder="Para saber de quién son"
                className="mt-1 w-full border-b border-papel-claro/40 bg-transparent py-2 text-[1.05rem] text-papel-claro outline-none placeholder:text-papel-claro/45 focus:border-dorado-claro"
              />

              <input
                ref={entrada}
                id="elegir-fotos"
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                disabled={subiendo}
                onChange={(e) => subir(e.target.files)}
              />
              <label
                htmlFor="elegir-fotos"
                className={`rotulo mt-6 inline-block cursor-pointer rounded-sm bg-papel-claro px-7 py-3.5 text-[0.74rem] text-oliva-hondo shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6)] ${subiendo ? "pointer-events-none opacity-60" : ""}`}
              >
                {subiendo ? "Subiendo…" : "Elegir fotos o videos"}
              </label>
              <p className="mt-3 text-[0.92rem] italic text-papel-claro/70">Hasta {MAX_POR_TANDA} archivos por vez.</p>

              {prog && (
                <div className="mt-5" aria-live="polite">
                  {/* Avance total, más el del archivo en curso (en un video se nota). */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-papel-claro/20">
                    <div
                      className="h-full bg-dorado-claro transition-[width] duration-300"
                      style={{
                        width: `${((prog.listas + prog.fallidas + (subiendo ? (prog.pct ?? 0) / 100 : 0)) / prog.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[1rem] text-papel-claro/90">
                    {subiendo
                      ? `Subiendo ${prog.listas + prog.fallidas + 1} de ${prog.total}…${prog.pct ? ` ${prog.pct}%` : ""}`
                      : prog.listas > 0
                        ? `¡Listo! ${prog.listas === 1 ? "Subiste 1 archivo" : `Subiste ${prog.listas} archivos`}. Gracias ❤`
                        : "No se subió ningún archivo."}
                  </p>
                  {!subiendo && prog.error && prog.fallidas > 0 && (
                    <p className="mt-1 text-[0.95rem] italic text-dorado-claro">{prog.error}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </BandaOliva>
    </section>
  );
}
