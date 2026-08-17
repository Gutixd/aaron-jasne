import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador.
 *
 * Sobre la clave: la `anon key` es pública por diseño — va en el bundle y eso
 * es correcto. Lo que protege los datos no es esconderla, son las políticas
 * RLS de `supabase/schema.sql`: cualquiera puede insertar una confirmación,
 * nadie puede leer la lista de invitados sin sesión de administrador. La
 * `service_role` key jamás debe aparecer en este proyecto.
 *
 * Si faltan las variables el sitio corre igual en modo demostración: se ve y
 * se navega completo, los formularios validan, pero nada se guarda. Permite
 * revisar el diseño antes de tener la base lista.
 */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon) : null;

export const modoDemo = !supabase;
