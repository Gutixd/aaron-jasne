/**
 * Exporta el contenido editable de src/config/event.config.ts a
 * public/api/contenido-base.json. El panel lo usa como punto de partida:
 * muestra estos valores y en la base guarda solo lo que se cambie.
 *
 * Corre solo antes de `npm run dev` y `npm run build` (predev / prebuild).
 * Node 24 lee el .ts directamente (quita los tipos al importar).
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const raiz = new URL("..", import.meta.url);
const { evento } = await import(new URL("src/config/event.config.ts", raiz).href);

const base = {
  fecha: { iso: evento.fecha.iso, confirmada: evento.fecha.confirmada },
  textos: { anuncio: evento.textos.anuncio },
  lugar: { ...evento.lugar },
  whatsapp: { numero: evento.whatsapp.numero },
  programa: evento.programa.map((p) => ({ ...p })),
  menu: { nota: evento.menu.nota, tiempos: evento.menu.tiempos.map((t) => ({ ...t })) },
  vestimenta: { nota: evento.vestimenta.nota },
  regalo: { texto: evento.regalo.texto, transferencia: { ...evento.regalo.transferencia } },
  rsvp: { cierreIso: evento.rsvp.cierreIso },
};

const destino = fileURLToPath(new URL("public/api/contenido-base.json", raiz));
writeFileSync(destino, JSON.stringify(base, null, 2) + "\n");
console.log("contenido-base.json actualizado");
