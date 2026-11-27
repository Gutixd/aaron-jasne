import { motion } from "framer-motion";
import { Corazon, Divisor, Flores, BordeRasgado } from "../Ornamentos";
import Foto from "../Foto";
import Aparecer from "../Aparecer";
import { evento } from "@/config/event.config";

const suave = [0.22, 1, 0.36, 1] as const;

/**
 * Portada: rótulo, nombres en serif mayúscula con la "y" manuscrita,
 * "te invitan a su Boda" y la foto principal en arco con flores.
 * Debajo, el anuncio "Nos casamos" con el texto de invitación.
 */
export default function Portada() {
  const { pareja, textos, fotos } = evento;

  return (
    <section id="inicio" className="papel relative overflow-hidden px-6 pb-14 pt-14 text-center">
      <motion.p
        className="rotulo mx-auto max-w-[14rem] text-[0.72rem] leading-[1.7] text-tinta-suave"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: suave }}
      >
        {textos.encabezado}
      </motion.p>

      <motion.span
        className="mt-3 inline-block text-oliva"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: suave }}
      >
        <Corazon tam={10} />
      </motion.span>

      <h1 className="mt-5 text-oliva-hondo">
        <motion.span
          className="titular block text-[clamp(3rem,15vw,4.2rem)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.35, ease: suave }}
        >
          {pareja.uno}
        </motion.span>
        <motion.span
          className="manuscrita block -my-1 text-[clamp(2.2rem,11vw,3rem)] text-oliva"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.7 }}
        >
          y
        </motion.span>
        <motion.span
          className="titular block text-[clamp(3rem,15vw,4.2rem)]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.55, ease: suave }}
        >
          {pareja.dos}
        </motion.span>
      </h1>

      <motion.p
        className="rotulo mt-7 text-[0.74rem] text-tinta"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
      >
        {textos.invitan}
      </motion.p>
      <motion.p
        className="manuscrita mt-1 text-[clamp(2.8rem,14vw,3.6rem)] text-oliva-hondo"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.05, ease: suave }}
      >
        Boda
      </motion.p>

      {/* Foto en arco con filete dorado y flores que la abrazan. */}
      <motion.div
        className="relative mx-auto mt-8 w-[82%] max-w-[20rem]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.3, delay: 1.2, ease: suave }}
      >
        <span
          aria-hidden
          className="absolute -inset-2 rounded-t-full border border-dorado/70"
        />
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-full">
          <Foto src={fotos.portada} alt={`${pareja.uno} y ${pareja.dos}`} className="h-full w-full" prioridad />
          <BordeRasgado lado="arriba" fondo="papel" className="absolute inset-x-0 -bottom-px" />
        </div>
        <Flores src={fotos.floresEsquina} className="absolute -bottom-6 -left-10 w-28" />
        <Flores src={fotos.floresEsquina} className="absolute -bottom-6 -right-10 w-28" espejo />
      </motion.div>

      <Aparecer className="mt-14">
        <p className="manuscrita text-[2.3rem] text-oliva">Nos</p>
        <h2 className="titular -mt-1 text-[2.2rem] text-oliva-hondo">casamos</h2>
        <Divisor className="mt-4 text-oliva" />
        <p className="mx-auto mt-5 max-w-[19rem] text-[1.08rem] leading-[1.6]">{textos.anuncio}</p>
        <Divisor className="mt-6 text-oliva" />
      </Aparecer>
    </section>
  );
}
