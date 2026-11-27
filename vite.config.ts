import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  // 4410 y no 4400: ese puerto lo usa otro proyecto de esta máquina.
  // /api y /panel son PHP: en local los atiende `php -S` en el 4411
  // (lo levanta "Abrir invitacion.bat"). En Hostinger viven en el mismo dominio.
  server: {
    port: 4410,
    open: true,
    proxy: {
      "/api": "http://localhost:4411",
      "/panel": "http://localhost:4411",
    },
  },
  preview: { port: 4410 },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules") && (id.includes("framer-motion") || id.includes("motion-dom"))) {
            return "motion";
          }
        },
      },
    },
  },
});
