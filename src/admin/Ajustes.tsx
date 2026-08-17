import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { evento } from "@/config/event.config";

type Ajuste = { clave: string; valor: unknown };

/** Campos editables. El orden es el de la pantalla. */
const CAMPOS: { clave: string; etiqueta: string; ayuda?: string; largo?: boolean }[] = [
  { clave: "fecha_iso", etiqueta: "Fecha y hora (ISO)", ayuda: "Ej: 2027-01-16T18:00:00-03:00" },
  { clave: "fecha_confirmada", etiqueta: "¿Fecha confirmada?", ayuda: "true o false" },
  { clave: "lugar_nombre", etiqueta: "Lugar" },
  { clave: "lugar_direccion", etiqueta: "Dirección" },
  { clave: "lugar_ciudad", etiqueta: "Ciudad" },
  { clave: "lugar_maps_url", etiqueta: "URL de Google Maps" },
  { clave: "lugar_consulta_mapa", etiqueta: "Búsqueda para el mapa", ayuda: "Lo que escribirías en Google Maps" },
  { clave: "whatsapp_numero", etiqueta: "WhatsApp", ayuda: "Formato internacional sin +. Ej: 56912345678" },
  { clave: "frase", etiqueta: "Frase principal", largo: true },
  { clave: "musica_titulo", etiqueta: "Canción" },
  { clave: "musica_artista", etiqueta: "Artista" },
  { clave: "dress_code", etiqueta: "Vestuario" },
];

export default function Ajustes() {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (!supabase) return setCargando(false);

    supabase
      .from("settings")
      .select("clave, valor")
      .then(({ data }) => {
        const m: Record<string, string> = {};
        for (const a of (data ?? []) as Ajuste[]) {
          m[a.clave] = typeof a.valor === "string" ? a.valor : JSON.stringify(a.valor);
        }
        setValores(m);
        setCargando(false);
      });
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setGuardando(true);
    const filas = CAMPOS.map((c) => ({
      clave: c.clave,
      valor: valores[c.clave] ?? "",
      updated_at: new Date().toISOString(),
    }));

    await supabase.from("settings").upsert(filas, { onConflict: "clave" });
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  if (cargando) return <div className="h-64 animate-pulse bg-hueso-hondo" />;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-4xl leading-none">Configuración</h1>
        <p className="mt-3 max-w-xl text-[0.85rem] leading-[1.85] text-tinta-suave">
          Estos valores se guardan en la base y mandan sobre los de{" "}
          <code className="text-rosa">event.config.ts</code>, que queda como
          respaldo por si la base no responde.
        </p>
      </header>

      <form onSubmit={guardar} className="max-w-2xl space-y-8">
        {CAMPOS.map((c) => (
          <div key={c.clave}>
            <label htmlFor={c.clave} className="eyebrow text-[0.45rem] text-tinta-suave">
              {c.etiqueta}
            </label>
            {c.largo ? (
              <textarea
                id={c.clave}
                rows={2}
                className="campo resize-none"
                value={valores[c.clave] ?? ""}
                onChange={(e) => setValores({ ...valores, [c.clave]: e.target.value })}
              />
            ) : (
              <input
                id={c.clave}
                className="campo"
                value={valores[c.clave] ?? ""}
                onChange={(e) => setValores({ ...valores, [c.clave]: e.target.value })}
              />
            )}
            {c.ayuda && (
              <p className="mt-1.5 text-[0.72rem] text-tinta-suave/60">{c.ayuda}</p>
            )}
          </div>
        ))}

        <div className="flex items-center gap-5 pt-4">
          <button
            type="submit"
            disabled={guardando}
            className="eyebrow cursor-pointer bg-noche px-8 py-3.5 text-[0.5rem] text-hueso transition-colors hover:bg-rosa disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
          {guardado && <span className="text-[0.82rem] text-rosa">Guardado ✓</span>}
        </div>
      </form>

      <section className="max-w-2xl border-t border-piedra/60 pt-10">
        <h2 className="eyebrow text-[0.45rem] text-tinta-suave">Lo que aún se edita en código</h2>
        <ul className="mt-5 space-y-2.5 text-[0.85rem] leading-relaxed text-tinta-suave">
          <li>
            <span className="text-tinta">Fotografías</span> — se dejan en{" "}
            <code className="text-rosa">public/fotos/</code> y se declaran en{" "}
            <code className="text-rosa">event.config.ts</code>.
          </li>
          <li>
            <span className="text-tinta">Música</span> — el archivo va en{" "}
            <code className="text-rosa">public/music/</code>.
          </li>
          <li>
            <span className="text-tinta">Historia y cronograma</span> — en{" "}
            <code className="text-rosa">event.config.ts</code>. Las tablas{" "}
            <code className="text-rosa">timeline</code> y{" "}
            <code className="text-rosa">gallery</code> ya existen en la base para
            moverlos al panel cuando haga falta.
          </li>
        </ul>
        <p className="mt-6 text-[0.8rem] leading-relaxed text-tinta-suave/70">
          Preferimos decirlo aquí a fingir formularios que no guardan nada. Es{" "}
          {evento.pareja.uno} y {evento.pareja.dos} quienes tienen que poder
          confiar en este panel.
        </p>
      </section>
    </div>
  );
}
