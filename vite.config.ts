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
  server: { port: 4410, open: true },
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
