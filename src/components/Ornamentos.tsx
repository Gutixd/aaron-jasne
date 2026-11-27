import { useState } from "react";

/* ─────────────────────────────────────────────────────────── corazón */

export function Corazon({ tam = 9, className = "" }: { tam?: number; className?: string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 12 11" className={className} aria-hidden>
      <path
        d="M6 10.4 C2.4 7.7 0.5 5.9 0.5 3.6 C0.5 1.9 1.8 0.6 3.4 0.6 C4.5 0.6 5.4 1.2 6 2.1 C6.6 1.2 7.5 0.6 8.6 0.6 C10.2 0.6 11.5 1.9 11.5 3.6 C11.5 5.9 9.6 7.7 6 10.4 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Separador de la referencia: filete — corazón — filete. */
export function Divisor({
  className = "",
  ancho = "4.5rem",
}: {
  className?: string;
  ancho?: string;
}) {
  return (
    <span className={`flex items-center justify-center gap-2.5 ${className}`} aria-hidden>
      <span className="block h-px bg-current opacity-40" style={{ width: ancho }} />
      <Corazon tam={9} />
      <span className="block h-px bg-current opacity-40" style={{ width: ancho }} />
    </span>
  );
}

/* ──────────────────────────────────────────────────────── ramita dorada */

/** Ramita vertical con hojas en pares: encabeza el programa. */
export function Ramita({ tam = 34, className = "" }: { tam?: number; className?: string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" className={className} aria-hidden fill="currentColor">
      <path d="M20 38 C20 28 20 16 20 4" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M20 6 C17 3 17 0.5 20 0 C23 0.5 23 3 20 6 Z" />
      {[12, 19, 26].map((y) => (
        <g key={y}>
          <path d={`M20 ${y} C14 ${y - 2} 11 ${y - 7} 12 ${y - 10} C16 ${y - 9} 19 ${y - 5} 20 ${y} Z`} />
          <path d={`M20 ${y} C26 ${y - 2} 29 ${y - 7} 28 ${y - 10} C24 ${y - 9} 21 ${y - 5} 20 ${y} Z`} />
        </g>
      ))}
    </svg>
  );
}

/** Rama horizontal fina, como la de abajo del dress code. */
export function RamaHorizontal({ ancho = 90, className = "" }: { ancho?: number; className?: string }) {
  return (
    <svg width={ancho} height={ancho * 0.22} viewBox="0 0 100 22" className={className} aria-hidden fill="currentColor">
      <path d="M4 12 C30 11 70 11 96 12" stroke="currentColor" strokeWidth="0.9" fill="none" />
      {[20, 34, 48, 62, 76].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 12 C${x + 3} 6 ${x + 9} 4 ${x + 12} 5 C${x + 10} 9 ${x + 5} 12 ${x} 12 Z`} opacity={i % 2 ? 0.85 : 1} />
          <path d={`M${x + 4} 12 C${x + 7} 17 ${x + 12} 19 ${x + 15} 18 C${x + 13} 14 ${x + 9} 12 ${x + 4} 12 Z`} opacity={0.8} />
        </g>
      ))}
      <circle cx="4" cy="12" r="1.6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────── papel rasgado */

/**
 * Borde de papel rasgado entre una zona crema y una oliva. El trazo es
 * irregular pero fijo (semilla), para que no cambie en cada carga.
 * `lado="arriba"`: la banda oliva empieza aquí y sube rasgada.
 */
export function BordeRasgado({
  lado,
  className = "",
  fondo = "oliva",
}: {
  lado: "arriba" | "abajo";
  className?: string;
  /** Superficie que empieza en el rasgado. */
  fondo?: "oliva" | "papel";
}) {
  let s = lado === "arriba" ? 7 : 13;
  const azar = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  // Puntos del rasgado en una caja de 400 × 30.
  const pts: [number, number][] = [];
  for (let x = 0; x <= 400; x += 5 + azar() * 7) {
    pts.push([x, 7 + azar() * 12 + (azar() > 0.86 ? -5 : 0)]);
  }
  pts.push([400, 12]);

  /**
   * Se dibuja como recorte (clip-path) de un bloque con la MISMA textura
   * de papel que la banda contigua. Con un SVG de color plano, el borde y
   * la banda texturada tenían tonos distintos y se notaba una franja.
   */
  const poligono = (desplazar: number) => {
    const pos = (x: number, y: number) => {
      const yy = lado === "arriba" ? y - desplazar : 30 - (y - desplazar);
      return `${((x / 400) * 100).toFixed(2)}% ${((yy / 30) * 100).toFixed(2)}%`;
    };
    const base = lado === "arriba" ? "100%" : "0%";
    return `polygon(0% ${base}, ${pts.map(([x, y]) => pos(x, y)).join(", ")}, 100% ${base})`;
  };

  return (
    // `relative` solo si quien lo usa no lo posiciona ya (p. ej. `absolute`
    // sobre una foto): las dos clases juntas se pisan.
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} h-6 w-full ${className}`} aria-hidden>
      {/* Fibra clara al borde del rasgado, como en el papel real. */}
      <div className="absolute inset-0 bg-[#d9d2c2]/55" style={{ clipPath: poligono(2.2) }} />
      <div
        className={`absolute inset-0 ${fondo === "oliva" ? "papel-oliva" : "papel"}`}
        style={{ clipPath: poligono(0) }}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────── banda oliva */

/** Puntos irregulares de un rasgado: x de 0 a 100 (%), alto 0–24 px. Fijos por semilla. */
function puntosRasgado(semilla: number): [number, number][] {
  let s = semilla;
  const azar = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const pts: [number, number][] = [];
  for (let x = 0; x <= 100; x += 1.25 + azar() * 1.75) {
    pts.push([x, (7 + azar() * 12 + (azar() > 0.86 ? -5 : 0)) * 0.8]);
  }
  pts.push([100, 9.6]);
  return pts;
}

const RASGO = 24; // alto reservado para el rasgado, en px

/**
 * Banda oliva con los bordes rasgados como contorno del mismo bloque.
 *
 * Antes el rasgado era una pieza aparte pegada a la banda: la textura de
 * papel reiniciaba su patrón en la unión y quedaba una franja de otro tono.
 * Aquí es una sola superficie recortada con clip-path, así que no hay unión.
 */
export function BandaOliva({
  children,
  arriba = true,
  abajo = true,
  className = "",
}: {
  children: React.ReactNode;
  arriba?: boolean;
  abajo?: boolean;
  className?: string;
}) {
  const sup = puntosRasgado(7);
  const inf = puntosRasgado(13);

  const contorno = (salida: number) => {
    const top = arriba
      ? sup.map(([x, y]) => `${x.toFixed(2)}% ${Math.max(0, y - salida).toFixed(1)}px`)
      : ["0% 0px", "100% 0px"];
    const bottom = abajo
      ? [...inf]
          .reverse()
          .map(([x, y]) => `${x.toFixed(2)}% calc(100% - ${Math.max(0, y - salida).toFixed(1)}px)`)
      : ["100% 100%", "0% 100%"];
    return `polygon(${[...top, ...bottom].join(", ")})`;
  };

  return (
    <div className="relative">
      {/* Fibra clara que asoma en el borde del rasgado, como en el papel real. */}
      <div aria-hidden className="absolute inset-0 bg-[#d9d2c2]/55" style={{ clipPath: contorno(2) }} />
      <div
        className={`papel-oliva relative ${className}`}
        style={{
          clipPath: contorno(0),
          paddingTop: arriba ? RASGO : undefined,
          paddingBottom: abajo ? RASGO : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── flores */

/**
 * Rama de hojas dibujada. Es el reemplazo de las rosas mientras no haya un
 * PNG de flores en public/fotos/: sobria, en los verdes de la invitación.
 */
export function Ramo({ className = "", espejo = false }: { className?: string; espejo?: boolean }) {
  const hojas = [
    [18, 104, -38], [30, 90, 30], [38, 74, -30], [50, 62, 34], [56, 46, -26],
    [68, 36, 38], [72, 20, -20], [86, 14, 40], [26, 116, 28],
  ];
  return (
    <svg
      viewBox="0 0 120 130"
      className={className}
      style={espejo ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden
    >
      <path d="M8 128 C30 100 50 70 92 8" stroke="#6f7259" strokeWidth="1.4" fill="none" />
      <path d="M40 82 C30 76 22 66 22 58" stroke="#6f7259" strokeWidth="1" fill="none" />
      {hojas.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="4.6"
          ry="11"
          transform={`rotate(${r} ${x} ${y})`}
          fill={i % 3 === 0 ? "#a8ad95" : i % 3 === 1 ? "#6f7259" : "#8c9078"}
          opacity="0.9"
        />
      ))}
      {[[22, 56], [94, 7], [60, 30]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="5.5" fill="#f3efe6" stroke="#d6cfbf" strokeWidth="0.8" />
          <circle cx={x} cy={y} r="2.6" fill="none" stroke="#d6cfbf" strokeWidth="0.7" />
        </g>
      ))}
    </svg>
  );
}

/**
 * Flores: usa el PNG si existe; si no, la rama dibujada. `respaldo`
 * reemplaza esa rama cuando el hueco no tiene forma de rama (por ejemplo,
 * una guirnalda a todo el ancho, donde una sola rama quedaría gigante).
 */
export function Flores({
  src,
  className = "",
  espejo = false,
  respaldo,
}: {
  src: string;
  className?: string;
  espejo?: boolean;
  respaldo?: React.ReactNode;
}) {
  const [falla, setFalla] = useState(false);

  if (falla) return respaldo ? <>{respaldo}</> : <Ramo className={className} espejo={espejo} />;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFalla(true)}
      className={`pointer-events-none select-none object-contain ${className}`}
      style={espejo ? { transform: "scaleX(-1)" } : undefined}
    />
  );
}
