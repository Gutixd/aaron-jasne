# Aaron & Jasne

Invitación digital estilo "jardín": papel crema envejecido, verde oliva y
dorado, letra manuscrita. Pensada primero para el celular.

React + TypeScript + Vite · Tailwind v4 · Framer Motion, con un backend
pequeño en PHP + MySQL para guardar las confirmaciones (Hostinger).

## Verla en local

Doble clic en **`Abrir invitacion.bat`**. Levanta la invitación en
http://localhost:4410 y el panel de confirmaciones en
http://localhost:4410/panel/ (la clave local está en `CLAVE-PANEL.txt`).

## Versiones

- **Actual:** diseño oliva/crema (esta carpeta).
- **Anterior:** diseño noche/rosa seco con la carta de entrada. Guardado en
  git con la etiqueta `v1-noche` (`git checkout v1-noche` para verlo) y
  publicado en el dominio temporal de Hostinger
  `polar-orangered-oyster-99.hostingersite.com`.

---

## Fotos

Se ponen **soltando archivos en `public/fotos/`** con el nombre indicado, sin
tocar código. La lista de nombres está en `public/fotos/LEEME.md`. Mientras
falte una, la invitación muestra un hueco con su nombre.

## Contenido

Todo el texto vive en `src/config/event.config.ts`, con dos marcas:

- **`PENDIENTE`** — dato real que todavía no se sabe (hoy: el día exacto de
  enero). La invitación dice "fecha estimada".
- **`FICTICIO`** — ejemplo para ver el diseño: lugar, horarios del programa,
  textos de invitación y regalo, fecha límite de confirmación. Reemplazar
  antes de enviar.

Reales: nombres, WhatsApp, canción (`public/music/event-song.mp3`).

**La fecha límite de confirmación nunca debe quedar en el pasado**: pasada esa
fecha el formulario se cierra solo.

---

## Confirmaciones

El formulario guarda cada respuesta en MySQL (`public/api/confirmar.php`) y
aparece en el panel `/panel/`, con totales, filtros, búsqueda y descarga a
Excel. Si el servidor fallara, el invitado recibe un enlace a WhatsApp con su
respuesta ya escrita, para que nunca quede atascado.

### Publicar en Hostinger

1. `npm run build` y subir el contenido de `dist/` a `public_html`.
2. hPanel › Bases de datos › crear una base MySQL (nombre, usuario, clave).
3. Copiar `servidor/config.example.php` como `public_html/api/config.php` y
   completar los datos de la base, el hash de la clave del panel
   (`php servidor/crear-clave.php "la-clave"`) y una sal aleatoria.

Las tablas se crean solas la primera vez. `config.php` nunca va a git.

---

## Estructura

```
src/
  config/event.config.ts   ← todo el contenido
  lib/          calendar · whatsapp · analytics
  components/   Sobre · Musica · Foto · Ornamentos · Iconos · Aparecer · Confeti
    secciones/  Portada · Fecha · ConAmor · Programa · DressCode
                Cita · Lugar · Galeria · Confirmar · Cierre
public/
  api/          confirmar.php · _base.php        (PHP)
  panel/        index.php · exportar.php         (PHP)
  fotos/  music/
servidor/       esquemas SQL, plantilla de config, herramientas locales
```

## Accesibilidad y rendimiento

- `prefers-reduced-motion` desactiva las animaciones y el scroll suave.
- Fuentes autoalojadas (Cormorant Garamond y Pinyon Script).
- Imágenes con `loading="lazy"`; el audio con `preload="none"`.
- Visor de galería con teclado (← → Esc) y deslizamiento con el dedo.
