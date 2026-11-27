import { useEffect, useState } from "react";
import Lenis from "lenis";

import Sobre from "./components/Sobre";
import Musica from "./components/Musica";
import LateralesEscritorio from "./components/LateralesEscritorio";

import Portada from "./components/secciones/Portada";
import Fecha from "./components/secciones/Fecha";
import ConAmor from "./components/secciones/ConAmor";
import Programa from "./components/secciones/Programa";
import Menu from "./components/secciones/Menu";
import DressCode from "./components/secciones/DressCode";
import Cita from "./components/secciones/Cita";
import Lugar from "./components/secciones/Lugar";
import Galeria from "./components/secciones/Galeria";
import FotosInvitados from "./components/secciones/FotosInvitados";
import Confirmar from "./components/secciones/Confirmar";
import Cierre from "./components/secciones/Cierre";

import { medir } from "@/lib/analytics";
import { useMovimientoReducido } from "@/hooks";

/**
 * La invitación es una sola columna, pensada primero para el celular. En
 * pantallas grandes la columna queda centrada sobre el fondo oliva, como la
 * tarjeta de la referencia, en vez de estirarse.
 *
 * Orden: el de la referencia leída de arriba abajo — portada, fecha, banda
 * "con amor", programa, dress code, cita, lugar, galería — más la
 * confirmación de asistencia y el cierre.
 */
export default function Invitacion() {
  const [abierta, setAbierta] = useState(false);
  const reducido = useMovimientoReducido();

  // Scroll suave solo con ratón; en táctil el nativo es mejor.
  useEffect(() => {
    if (reducido || window.matchMedia("(pointer: coarse)").matches) return;
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

  return (
    <>
      <Sobre
        onAbrir={() => {
          setAbierta(true);
          medir("entrar_experiencia");
        }}
      />
      <Musica arrancar={abierta} />
      <LateralesEscritorio />

      <main className="papel mx-auto w-full max-w-[30rem] shadow-[0_0_60px_rgba(0,0,0,0.35)]">
        <Portada />
        <Fecha />
        <ConAmor />
        <Programa />
        <Menu />
        <DressCode />
        <Cita />
        <Lugar />
        <Galeria />
        <FotosInvitados />
        <Confirmar />
        <Cierre />
      </main>
    </>
  );
}
