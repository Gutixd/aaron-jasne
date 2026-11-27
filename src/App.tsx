import { useEffect } from "react";
import Invitacion from "./Invitacion";
import { iniciarAnalytics } from "@/lib/analytics";

/**
 * Sitio de una sola página, sin servidor ni base de datos: la invitación es
 * todo lo que hay. Las confirmaciones viajan por WhatsApp.
 */
export default function App() {
  useEffect(() => {
    iniciarAnalytics();
  }, []);

  return <Invitacion />;
}
