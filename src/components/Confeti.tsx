import { useEffect, useRef } from "react";
import { useMovimientoReducido } from "@/hooks";

/**
 * Confeti propio, en canvas.
 *
 * No usamos una librería porque todas lanzan círculos de colores de fiesta
 * infantil. Esto lanza recortes de papel rectangulares que giran sobre su
 * eje, en los colores de la invitación — parece papelería cayendo, no una
 * piñata. Se dispara una sola vez, al confirmar asistencia.
 */
const PALETA = ["#9C5A54", "#C08A80", "#CEC5B7", "#F4F0E8", "#EAE4D9"];

type Papel = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ancho: number;
  alto: number;
  giro: number;
  vGiro: number;
  color: string;
  vida: number;
};

export default function Confeti({ activo }: { activo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducido = useMovimientoReducido();

  useEffect(() => {
    if (!activo || reducido) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    canvas.style.width = `${ancho}px`;
    canvas.style.height = `${alto}px`;
    ctx.scale(dpr, dpr);

    // Dos surtidores desde las esquinas inferiores: se cruzan arriba y
    // caen por el centro. Más elegante que una explosión central.
    const papeles: Papel[] = [];
    const porLado = window.innerWidth < 640 ? 40 : 65;

    for (const lado of [-1, 1] as const) {
      for (let i = 0; i < porLado; i++) {
        const angulo = (Math.random() * 0.55 + 0.55) * Math.PI * 0.5;
        const fuerza = 11 + Math.random() * 13;
        papeles.push({
          x: lado === -1 ? 0 : ancho,
          y: alto * 0.92,
          vx: Math.cos(angulo) * fuerza * -lado,
          vy: -Math.sin(angulo) * fuerza,
          ancho: 5 + Math.random() * 7,
          alto: 8 + Math.random() * 10,
          giro: Math.random() * Math.PI,
          vGiro: (Math.random() - 0.5) * 0.24,
          color: PALETA[Math.floor(Math.random() * PALETA.length)],
          vida: 1,
        });
      }
    }

    let frame = 0;
    let detenido = false;

    const dibujar = () => {
      ctx.clearRect(0, 0, ancho, alto);
      let vivos = 0;

      for (const p of papeles) {
        p.vy += 0.32; // gravedad
        p.vx *= 0.992; // resistencia del aire
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.giro += p.vGiro;
        if (p.y > alto * 0.55) p.vida -= 0.012;

        if (p.vida <= 0 || p.y > alto + 60) continue;
        vivos++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.giro);
        ctx.globalAlpha = Math.max(0, p.vida);
        ctx.fillStyle = p.color;
        // El ancho oscila con el giro: simula el papel de canto.
        ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho * Math.abs(Math.cos(p.giro)), p.alto);
        ctx.restore();
      }

      if (vivos > 0 && !detenido) {
        frame = requestAnimationFrame(dibujar);
      } else {
        ctx.clearRect(0, 0, ancho, alto);
      }
    };

    frame = requestAnimationFrame(dibujar);
    return () => {
      detenido = true;
      cancelAnimationFrame(frame);
    };
  }, [activo, reducido]);

  if (!activo || reducido) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[85]"
    />
  );
}
