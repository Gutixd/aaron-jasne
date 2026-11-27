import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { cargarContenido } from "@/lib/contenido";

// Primero el contenido editado en el panel (máximo 1,5 s de espera), después
// la invitación: así nunca se ve un dato viejo que luego salta al nuevo.
cargarContenido().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
