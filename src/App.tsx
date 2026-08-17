import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Invitacion from "./Invitacion";
import { iniciarAnalytics } from "@/lib/analytics";

/**
 * El panel viaja en su propio chunk y solo se descarga al visitar /admin.
 * Un invitado que abre la invitación no paga el peso de la administración.
 */
const Admin = lazy(() => import("./admin/AdminApp"));

export default function App() {
  useEffect(() => {
    iniciarAnalytics();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Invitacion />} />
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<CargandoPanel />}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function CargandoPanel() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-hueso">
      <p className="eyebrow text-[0.55rem] text-tinta-suave">Cargando panel…</p>
    </div>
  );
}
