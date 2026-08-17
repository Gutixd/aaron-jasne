import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useInvitados, type Invitado, type Plantilla } from "./datos";
import { aplicarPlantilla, urlWhatsapp } from "@/lib/whatsapp";
import { evento, textoFecha } from "@/config/event.config";

type Grupo = "confirmados" | "no_asisten" | "sin_telefono" | "todos";

const grupos: { id: Grupo; texto: string }[] = [
  { id: "confirmados", texto: "Confirmados" },
  { id: "no_asisten", texto: "No asistirán" },
  { id: "todos", texto: "Todos" },
];

const VARIABLES = ["nombre", "acompanantes", "fecha", "lugar", "hora"];

/**
 * Mensajes.
 *
 * Importante y dicho sin adornos: esto NO envía nada solo. No hay WhatsApp
 * Business API configurada, así que lo que hace es abrir WhatsApp con el
 * mensaje ya escrito, uno por invitado, y la persona pulsa enviar. Toda la
 * interfaz está redactada así — "preparar", "abrir" — para no prometer un
 * envío automático que no existe.
 *
 * Cuando se contrate la API oficial, el único punto a cambiar es la función
 * `abrirUno`: las plantillas, las variables y la selección ya están listas.
 */
export default function Mensajes() {
  const { filas } = useInvitados();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cuerpo, setCuerpo] = useState("");
  const [grupo, setGrupo] = useState<Grupo>("confirmados");
  const [confirmando, setConfirmando] = useState(false);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("messages")
      .select("id, nombre, cuerpo")
      .order("created_at")
      .then(({ data }) => {
        const p = (data ?? []) as Plantilla[];
        setPlantillas(p);
        if (p[0] && !cuerpo) setCuerpo(p[0].cuerpo);
      });
    // Solo al montar: no queremos pisar lo que el usuario esté escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const destinatarios = useMemo(() => {
    const porGrupo = filas.filter((f) =>
      grupo === "todos" ? true : grupo === "confirmados" ? f.asistencia : !f.asistencia,
    );
    // Sin teléfono no hay a dónde abrir el chat.
    return porGrupo.filter((f) => f.telefono?.trim());
  }, [filas, grupo]);

  const sinTelefono = useMemo(
    () =>
      filas.filter(
        (f) =>
          !f.telefono?.trim() &&
          (grupo === "todos" || (grupo === "confirmados" ? f.asistencia : !f.asistencia)),
      ).length,
    [filas, grupo],
  );

  const textoPara = (f: Invitado) =>
    aplicarPlantilla(cuerpo, {
      nombre: f.nombre.split(" ")[0],
      acompanantes: f.acompanantes,
      fecha: textoFecha(),
      lugar: evento.lugar.nombre,
      hora: "",
    });

  const abrirUno = (f: Invitado) => {
    window.open(urlWhatsapp(textoPara(f), f.telefono!), "_blank", "noopener");
    setEnviados((s) => new Set(s).add(f.id));
  };

  const ejemplo = destinatarios[0];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl leading-none">Mensajes</h1>
        <p className="mt-3 max-w-xl text-[0.85rem] leading-[1.85] text-tinta-suave">
          Prepara un mensaje y ábrelo en WhatsApp para cada invitado. El envío
          lo confirmas tú en la aplicación: acá no se manda nada solo.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <section className="space-y-7">
          {plantillas.length > 0 && (
            <div>
              <span className="eyebrow text-[0.45rem] text-tinta-suave">Plantillas</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {plantillas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCuerpo(p.cuerpo)}
                    className={`eyebrow cursor-pointer border px-3.5 py-2 text-[0.42rem] transition-colors ${
                      cuerpo === p.cuerpo
                        ? "border-rosa text-rosa"
                        : "border-piedra text-tinta-suave hover:border-tinta"
                    }`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="cuerpo" className="eyebrow text-[0.45rem] text-tinta-suave">
              Mensaje
            </label>
            <textarea
              id="cuerpo"
              rows={7}
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              className="campo resize-none leading-[1.8]"
              placeholder="Hola {{nombre}}, …"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCuerpo((c) => `${c}{{${v}}}`)}
                  className="cursor-pointer border border-piedra px-2.5 py-1 font-mono text-[0.68rem] text-tinta-suave transition-colors hover:border-rosa hover:text-rosa"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="eyebrow text-[0.45rem] text-tinta-suave">Enviar a</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {grupos.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGrupo(g.id)}
                  className={`eyebrow cursor-pointer border px-4 py-2.5 text-[0.45rem] transition-colors ${
                    grupo === g.id
                      ? "border-rosa bg-rosa text-hueso"
                      : "border-piedra text-tinta-suave hover:border-tinta"
                  }`}
                >
                  {g.texto}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-7">
          <div>
            <span className="eyebrow text-[0.45rem] text-tinta-suave">Vista previa</span>
            <div className="mt-3 border border-piedra/70 bg-hueso-hondo p-5">
              {ejemplo ? (
                <>
                  <p className="eyebrow mb-3 text-[0.4rem] text-tinta-suave/60">
                    Como lo verá {ejemplo.nombre}
                  </p>
                  <p className="whitespace-pre-wrap text-[0.88rem] leading-[1.85]">
                    {textoPara(ejemplo)}
                  </p>
                </>
              ) : (
                <p className="text-[0.85rem] text-tinta-suave">
                  Nadie en este grupo tiene teléfono registrado todavía.
                </p>
              )}
            </div>
          </div>

          <div className="border border-piedra/70 p-5">
            <p className="text-[0.9rem]">
              Se abrirá un chat para{" "}
              <span className="font-display text-xl text-rosa">{destinatarios.length}</span>{" "}
              invitado{destinatarios.length === 1 ? "" : "s"}.
            </p>
            {sinTelefono > 0 && (
              <p className="mt-2.5 text-[0.78rem] leading-relaxed text-tinta-suave">
                {sinTelefono} de este grupo no tiene teléfono y quedan fuera.
              </p>
            )}

            {!confirmando ? (
              <button
                type="button"
                disabled={destinatarios.length === 0 || !cuerpo.trim()}
                onClick={() => setConfirmando(true)}
                className="eyebrow mt-6 w-full cursor-pointer bg-noche py-3.5 text-[0.5rem] text-hueso transition-colors hover:bg-rosa disabled:cursor-not-allowed disabled:opacity-40"
              >
                Preparar envíos
              </button>
            ) : (
              // Segunda barrera antes de abrir decenas de pestañas.
              <div className="mt-6 border-l-2 border-rosa pl-4">
                <p className="text-[0.85rem] leading-[1.8]">
                  Se abrirán {destinatarios.length} pestañas de WhatsApp, una por
                  invitado. Puede que el navegador pida permiso para abrirlas.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      destinatarios.forEach((f, i) =>
                        // Escalonadas: de golpe el navegador las bloquea.
                        setTimeout(() => abrirUno(f), i * 350),
                      );
                      setConfirmando(false);
                    }}
                    className="eyebrow cursor-pointer bg-rosa px-5 py-3 text-[0.45rem] text-hueso"
                  >
                    Sí, abrir todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="eyebrow cursor-pointer border border-piedra px-5 py-3 text-[0.45rem] text-tinta-suave"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {destinatarios.length > 0 && (
            <div>
              <span className="eyebrow text-[0.45rem] text-tinta-suave">
                O de a uno ({enviados.size} abiertos)
              </span>
              <ul className="mt-3 max-h-64 divide-y divide-piedra/50 overflow-y-auto border-y border-piedra/50">
                {destinatarios.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="text-[0.85rem]">
                      {f.nombre}
                      {enviados.has(f.id) && <span className="ml-2 text-rosa">✓</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => abrirUno(f)}
                      className="eyebrow cursor-pointer text-[0.42rem] text-tinta-suave transition-colors hover:text-rosa"
                    >
                      Abrir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
