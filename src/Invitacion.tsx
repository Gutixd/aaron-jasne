import { useEffect, useState } from "react";
import Lenis from "lenis";

import Portal from "./components/Portal";
import Musica from "./components/Musica";
import Cursor from "./components/Cursor";
import Navegacion, { Progreso } from "./components/Navegacion";

import Portada from "./components/secciones/Portada";
import Cuenta from "./components/secciones/Cuenta";
import Historia from "./components/secciones/Historia";
import Galeria from "./components/secciones/Galeria";
import GranDia from "./components/secciones/GranDia";
import Cronograma from "./components/secciones/Cronograma";
import Llegar from "./components/secciones/Llegar";
import Confirmar from "./components/secciones/Confirmar";
import CierreSeccion from "./components/secciones/Cierre";

import { medir } from "@/lib/analytics";
import { useMovimientoReducido } from "@/hooks";

export default function Invitacion() {
  const [entrado, setEntrado] = useState(false);
  const reducido = useMovimientoReducido();

  /**
   * Desplazamiento suave con Lenis. Se activa solo en escritorio con ratón:
   * en táctil el scroll nativo del sistema ya es bueno e interceptarlo se
   * siente mal. Y con movimiento reducido no se monta en absoluto.
   */
  useEffect(() => {
    if (reducido) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let frame = 0;

    const bucle = (t: number) => {
      lenis.raf(t);
      frame = requestAnimationFrame(bucle);
    };
    frame = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [reducido]);

  const entrar = () => {
    setEntrado(true);
    medir("entrar_experiencia");
  };

  return (
    <>
      <span className="grano" aria-hidden />
      <Cursor />
      <Portal onEntrar={entrar} />
      <Musica arrancar={entrado} />
      <Progreso />
      <Navegacion />

      <main>
        <Portada />
        <Cuenta />
        <Historia />
        <Galeria />
        <GranDia />
        <Cronograma />
        <Llegar />
        <Confirmar />
        <CierreSeccion />
      </main>
    </>
  );
}
