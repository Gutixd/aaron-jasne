import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Invitado = {
  id: string;
  nombre: string;
  telefono: string | null;
  asistencia: boolean;
  acompanantes: number;
  alimentacion: string | null;
  mensaje: string | null;
  nota_interna: string | null;
  created_at: string;
};

export type Plantilla = {
  id: string;
  nombre: string;
  cuerpo: string;
};

/** Estado derivado que usa toda la administración. */
export type Filtro = "todos" | "confirmados" | "no_asisten";

export function useInvitados() {
  const [filas, setFilas] = useState<Invitado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!supabase) return setCargando(false);

    setCargando(true);
    const { data, error: err } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else setFilas((data ?? []) as Invitado[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { filas, cargando, error, recargar: cargar, setFilas };
}

/** Todos los números del panel se calculan aquí, en un solo lugar. */
export function resumir(filas: Invitado[]) {
  const confirmados = filas.filter((f) => f.asistencia);
  const rechazan = filas.filter((f) => !f.asistencia);
  const acompanantes = confirmados.reduce((n, f) => n + f.acompanantes, 0);
  const personas = confirmados.length + acompanantes;
  const respuestas = filas.length;

  return {
    respuestas,
    confirmados: confirmados.length,
    rechazan: rechazan.length,
    acompanantes,
    personas,
    /** Sobre quienes respondieron: qué proporción dijo que sí. */
    tasa: respuestas ? Math.round((confirmados.length / respuestas) * 100) : 0,
    conRestriccion: confirmados.filter((f) => f.alimentacion?.trim()),
    conMensaje: filas.filter((f) => f.mensaje?.trim()),
  };
}

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
