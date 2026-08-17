import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: { port: 4400 },
  build: {
    // El panel viaja en su propio chunk: un invitado que solo abre la
    // invitación nunca descarga el código de administración.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@supabase")) return "supabase";
            if (id.includes("framer-motion") || id.includes("motion-dom")) return "motion";
            if (id.includes("react-router")) return "router";
          }
        },
      },
    },
  },
});
