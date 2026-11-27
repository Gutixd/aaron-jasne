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

type Estado = "cargando" | "antes" | "abierto" | "cerrado" | "sin_servidor";
type Progreso = { total: number; listas: number; fallidas: number; error: string | null };

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
  const entrada = useRef<HTMLInputElement>(null);
  const invitado = useInvitadoDelLink();

  useEffect(() => {
    fetch(API)
      .then((r) => r.json())
      .then((j: { estado?: Estado }) => setEstado(j.estado ?? "sin_servidor"))
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

    // De a una: si se corta la señal, solo se pierde esa foto.
    for (const a of archivos) {
      try {
        const cuerpo = new FormData();
        const blob = await achicar(a);
        cuerpo.append("foto", blob, blob === a ? a.name : "foto.jpg");
        if (autor.trim()) cuerpo.append("autor", autor.trim());
        const r = await fetch(API, { method: "POST", body: cuerpo });
        const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
        if (r.ok && j?.ok) p.listas++;
        else {
          p.fallidas++;
          p.error = j?.error ?? "Una foto no se pudo subir.";
          // Topes del servidor (límite por hora o espacio lleno): no insistir.
          if (r.status === 429 || r.status === 507 || r.status === 403) {
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
              <p className="text-[1.05rem] leading-[1.6] text-papel-claro/90">
                Sube las fotos que tomaste hoy. Les llegan directo a los novios, nadie más las ve.
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
                accept="image/*"
                multiple
                className="sr-only"
                disabled={subiendo}
                onChange={(e) => subir(e.target.files)}
              />
              <label
                htmlFor="elegir-fotos"
                className={`rotulo mt-6 inline-block cursor-pointer rounded-sm bg-papel-claro px-7 py-3.5 text-[0.74rem] text-oliva-hondo shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6)] ${subiendo ? "pointer-events-none opacity-60" : ""}`}
              >
                {subiendo ? "Subiendo…" : "Elegir fotos"}
              </label>
              <p className="mt-3 text-[0.92rem] italic text-papel-claro/70">Hasta {MAX_POR_TANDA} fotos por vez.</p>

              {prog && (
                <div className="mt-5" aria-live="polite">
                  <div className="h-1.5 overflow-hidden rounded-full bg-papel-claro/20">
                    <div
                      className="h-full bg-dorado-claro transition-[width] duration-300"
                      style={{ width: `${((prog.listas + prog.fallidas) / prog.total) * 100}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[1rem] text-papel-claro/90">
                    {subiendo
                      ? `Subiendo ${prog.listas + prog.fallidas + 1} de ${prog.total}…`
                      : prog.listas > 0
                        ? `¡Listo! ${prog.listas === 1 ? "Subiste 1 foto" : `Subiste ${prog.listas} fotos`}. Gracias ❤`
                        : "No se subió ninguna foto."}
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
