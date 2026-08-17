import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useInvitados, fechaCorta, type Filtro, type Invitado } from "./datos";
import { hayWhatsapp, urlWhatsapp } from "@/lib/whatsapp";

const filtros: { id: Filtro; texto: string }[] = [
  { id: "todos", texto: "Todos" },
  { id: "confirmados", texto: "Confirmados" },
  { id: "no_asisten", texto: "No asistirán" },
];

export default function Invitados() {
  const { filas, cargando, error, recargar } = useInvitados();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Invitado | null>(null);
  const [nuevo, setNuevo] = useState(false);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas
      .filter((f) =>
        filtro === "todos" ? true : filtro === "confirmados" ? f.asistencia : !f.asistencia,
      )
      .filter((f) => (q ? f.nombre.toLowerCase().includes(q) : true));
  }, [filas, filtro, busqueda]);

  const borrar = async (f: Invitado) => {
    if (!supabase) return;
    if (!confirm(`¿Eliminar la respuesta de ${f.nombre}? No se puede deshacer.`)) return;
    await supabase.from("guests").delete().eq("id", f.id);
    await recargar();
  };

  const alternar = async (f: Invitado) => {
    if (!supabase) return;
    await supabase.from("guests").update({ asistencia: !f.asistencia }).eq("id", f.id);
    await recargar();
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl leading-none">Invitados</h1>
          <p className="mt-3 text-[0.85rem] text-tinta-suave">
            {visibles.length} de {filas.length} respuesta{filas.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setNuevo(true)}
            className="eyebrow cursor-pointer border border-piedra px-5 py-2.5 text-[0.5rem] transition-colors hover:border-rosa hover:text-rosa"
          >
            Agregar a mano
          </button>
          <button
            type="button"
            onClick={() => exportarCsv(visibles)}
            className="eyebrow cursor-pointer border border-piedra px-5 py-2.5 text-[0.5rem] transition-colors hover:border-rosa hover:text-rosa"
          >
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex gap-1">
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`eyebrow cursor-pointer border-b-2 px-3 py-2 text-[0.48rem] transition-colors ${
                filtro === f.id
                  ? "border-rosa text-rosa"
                  : "border-transparent text-tinta-suave hover:text-tinta"
              }`}
            >
              {f.texto}
            </button>
          ))}
        </div>

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar invitado"
          className="campo max-w-56 flex-1 text-[0.85rem]"
        />
      </div>

      {error && <p className="text-[0.85rem] text-rosa">{error}</p>}

      {cargando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-hueso-hondo" />
          ))}
        </div>
      ) : visibles.length === 0 ? (
        <div className="border border-dashed border-piedra px-8 py-16 text-center">
          <p className="font-display text-xl text-tinta-suave">
            {filas.length === 0 ? "Todavía nadie ha respondido" : "Nada coincide con ese filtro"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-piedra/70">
          <table className="w-full min-w-[46rem] text-left text-[0.85rem]">
            <thead className="border-b border-piedra/70 bg-hueso-hondo">
              <tr className="eyebrow text-[0.42rem] text-tinta-suave">
                <th className="px-4 py-3.5">Nombre</th>
                <th className="px-4 py-3.5">Teléfono</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5">Acomp.</th>
                <th className="px-4 py-3.5">Alimentación</th>
                <th className="px-4 py-3.5">Fecha</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} className="border-b border-piedra/40 last:border-0">
                  <td className="px-4 py-3.5">
                    {f.nombre}
                    {f.mensaje && (
                      <span
                        className="ml-2 cursor-help text-rosa"
                        title={f.mensaje}
                        aria-label="Dejó un mensaje"
                      >
                        ✎
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-tinta-suave">
                    {f.telefono ? (
                      hayWhatsapp() || f.telefono ? (
                        <a
                          href={urlWhatsapp("", f.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-rosa"
                        >
                          {f.telefono}
                        </a>
                      ) : (
                        f.telefono
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => alternar(f)}
                      title="Cambiar estado"
                      className={`eyebrow cursor-pointer border px-2.5 py-1 text-[0.42rem] transition-colors ${
                        f.asistencia
                          ? "border-rosa/50 text-rosa hover:bg-rosa hover:text-hueso"
                          : "border-piedra text-tinta-suave hover:border-tinta"
                      }`}
                    >
                      {f.asistencia ? "Asiste" : "No asiste"}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-tinta-suave">
                    {f.asistencia ? f.acompanantes : "—"}
                  </td>
                  <td className="max-w-44 truncate px-4 py-3.5 text-tinta-suave" title={f.alimentacion ?? ""}>
                    {f.alimentacion || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[0.75rem] tabular-nums text-tinta-suave/60">
                    {fechaCorta(f.created_at)}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setEditando(f)}
                      className="eyebrow cursor-pointer text-[0.42rem] text-tinta-suave transition-colors hover:text-rosa"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => borrar(f)}
                      className="eyebrow ml-4 cursor-pointer text-[0.42rem] text-tinta-suave/60 transition-colors hover:text-rosa"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editando || nuevo) && (
        <Formulario
          invitado={editando}
          onCerrar={() => {
            setEditando(null);
            setNuevo(false);
          }}
          onGuardado={async () => {
            setEditando(null);
            setNuevo(false);
            await recargar();
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── formulario */

function Formulario({
  invitado,
  onCerrar,
  onGuardado,
}: {
  invitado: Invitado | null;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [d, setD] = useState({
    nombre: invitado?.nombre ?? "",
    telefono: invitado?.telefono ?? "",
    asistencia: invitado?.asistencia ?? true,
    acompanantes: invitado?.acompanantes ?? 0,
    alimentacion: invitado?.alimentacion ?? "",
    nota_interna: invitado?.nota_interna ?? "",
  });
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || d.nombre.trim().length < 2) return;

    setGuardando(true);
    const fila = {
      nombre: d.nombre.trim(),
      telefono: d.telefono.trim() || null,
      asistencia: d.asistencia,
      acompanantes: d.asistencia ? d.acompanantes : 0,
      alimentacion: d.alimentacion.trim() || null,
      nota_interna: d.nota_interna.trim() || null,
    };

    if (invitado) await supabase.from("guests").update(fila).eq("id", invitado.id);
    else await supabase.from("guests").insert(fila);

    onGuardado();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-noche/60 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <form
        onSubmit={guardar}
        className="max-h-[86svh] w-full max-w-md overflow-y-auto bg-hueso p-8"
      >
        <h2 className="font-display text-2xl">
          {invitado ? "Editar invitado" : "Agregar invitado"}
        </h2>

        <div className="mt-8 space-y-6">
          <div>
            <label className="eyebrow text-[0.45rem] text-tinta-suave">Nombre</label>
            <input
              className="campo"
              value={d.nombre}
              onChange={(e) => setD({ ...d, nombre: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="eyebrow text-[0.45rem] text-tinta-suave">Teléfono</label>
            <input
              className="campo"
              value={d.telefono}
              onChange={(e) => setD({ ...d, telefono: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setD({ ...d, asistencia: v })}
                className={`eyebrow flex-1 cursor-pointer border px-4 py-3 text-[0.45rem] transition-colors ${
                  d.asistencia === v ? "border-rosa bg-rosa text-hueso" : "border-piedra"
                }`}
              >
                {v ? "Asiste" : "No asiste"}
              </button>
            ))}
          </div>

          {d.asistencia && (
            <div>
              <label className="eyebrow text-[0.45rem] text-tinta-suave">Acompañantes</label>
              <input
                type="number"
                min={0}
                max={10}
                className="campo"
                value={d.acompanantes}
                onChange={(e) => setD({ ...d, acompanantes: Number(e.target.value) })}
              />
            </div>
          )}

          <div>
            <label className="eyebrow text-[0.45rem] text-tinta-suave">Alimentación</label>
            <input
              className="campo"
              value={d.alimentacion}
              onChange={(e) => setD({ ...d, alimentacion: e.target.value })}
            />
          </div>

          <div>
            <label className="eyebrow text-[0.45rem] text-tinta-suave">
              Nota interna <span className="text-[0.4rem] opacity-60">(no la ve el invitado)</span>
            </label>
            <textarea
              rows={2}
              className="campo resize-none"
              value={d.nota_interna}
              onChange={(e) => setD({ ...d, nota_interna: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="eyebrow flex-1 cursor-pointer bg-noche py-3.5 text-[0.5rem] text-hueso transition-colors hover:bg-rosa disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onCerrar}
            className="eyebrow cursor-pointer border border-piedra px-6 text-[0.5rem] text-tinta-suave hover:border-tinta"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

/** CSV con BOM para que Excel en español abra bien los acentos. */
function exportarCsv(filas: Invitado[]) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const cabecera = [
    "nombre", "telefono", "estado", "acompanantes",
    "alimentacion", "mensaje", "nota_interna", "fecha",
  ];

  const cuerpo = filas.map((f) =>
    [
      f.nombre,
      f.telefono,
      f.asistencia ? "asiste" : "no asiste",
      f.acompanantes,
      f.alimentacion,
      f.mensaje,
      f.nota_interna,
      f.created_at,
    ]
      .map(esc)
      .join(","),
  );

  const csv = "﻿" + [cabecera.join(","), ...cuerpo].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "invitados.csv";
  a.click();
  URL.revokeObjectURL(url);
}
