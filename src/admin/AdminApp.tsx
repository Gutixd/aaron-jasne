import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { evento } from "@/config/event.config";
import Login from "./Login";
import Resumen from "./Resumen";
import Invitados from "./Invitados";
import Mensajes from "./Mensajes";
import Ajustes from "./Ajustes";

const paginas = [
  { a: "/admin", texto: "Resumen", fin: true },
  { a: "/admin/invitados", texto: "Invitados" },
  { a: "/admin/mensajes", texto: "Mensajes" },
  { a: "/admin/ajustes", texto: "Configuración" },
];

/**
 * Panel privado.
 *
 * La puerta real no está aquí sino en las políticas RLS: aunque alguien
 * renderizara este componente a la fuerza, sin una sesión que figure en
 * `admin_users` la base no devuelve ni una fila. Esta pantalla solo evita
 * mostrar una interfaz vacía a quien no corresponde.
 */
export default function AdminApp() {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setCargando(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSesion(s);
      setEsAdmin(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Confirmamos contra la base que esta sesión está autorizada.
  useEffect(() => {
    if (!supabase || !sesion) return;
    let vivo = true;

    supabase
      .from("admin_users")
      .select("id")
      .eq("id", sesion.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (vivo) setEsAdmin(!!data);
      });

    return () => {
      vivo = false;
    };
  }, [sesion]);

  if (!supabase) {
    return (
      <Aviso titulo="Base de datos sin configurar">
        Define <code className="text-rosa">VITE_SUPABASE_URL</code> y{" "}
        <code className="text-rosa">VITE_SUPABASE_ANON_KEY</code>, y ejecuta{" "}
        <code className="text-rosa">supabase/schema.sql</code>.
      </Aviso>
    );
  }

  if (cargando) return <Aviso titulo="Cargando…" />;
  if (!sesion) return <Login />;

  if (esAdmin === false) {
    return (
      <Aviso titulo="Sin permisos">
        Esta cuenta existe pero no está en <code className="text-rosa">admin_users</code>.
        Agrégala desde Supabase para poder entrar.
        <button
          type="button"
          onClick={() => supabase!.auth.signOut()}
          className="eyebrow mt-8 block cursor-pointer border-b border-tinta/25 pb-1 text-[0.55rem] text-tinta-suave hover:text-rosa"
        >
          Cerrar sesión
        </button>
      </Aviso>
    );
  }

  if (esAdmin === null) return <Aviso titulo="Verificando acceso…" />;

  return (
    <div className="min-h-[100svh] bg-hueso">
      <header className="sticky top-0 z-20 border-b border-piedra/60 bg-hueso/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="font-display text-xl leading-none">
              {evento.pareja.uno} <span className="text-rosa">&</span> {evento.pareja.dos}
            </p>
            <p className="eyebrow mt-1.5 text-[0.45rem] text-tinta-suave/60">Panel</p>
          </div>

          <nav className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap gap-1">
              {paginas.map((p) => (
                <li key={p.a}>
                  <NavLink
                    to={p.a}
                    end={p.fin}
                    className={({ isActive }) =>
                      `eyebrow block px-3 py-2 text-[0.52rem] transition-colors ${
                        isActive
                          ? "text-rosa"
                          : "text-tinta-suave hover:text-tinta"
                      }`
                    }
                  >
                    {p.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <button
            type="button"
            onClick={() => supabase!.auth.signOut()}
            className="eyebrow cursor-pointer border border-piedra px-4 py-2 text-[0.5rem] text-tinta-suave transition-colors hover:border-rosa hover:text-rosa"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        <Routes>
          <Route index element={<Resumen />} />
          <Route path="invitados" element={<Invitados />} />
          <Route path="mensajes" element={<Mensajes />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Routes>
      </main>
    </div>
  );
}

function Aviso({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-hueso px-6">
      <div className="max-w-sm text-center">
        <p className="font-display text-2xl">{titulo}</p>
        {children && (
          <div className="mt-5 text-[0.85rem] leading-[1.9] text-tinta-suave">{children}</div>
        )}
      </div>
    </div>
  );
}
