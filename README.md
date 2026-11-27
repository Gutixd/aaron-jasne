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

## Lista de invitados y confirmaciones

En el panel `/panel/` › **Invitados** se carga la lista: cada fila es una
invitación (persona o familia) con su saludo, los nombres con que se la
puede buscar y sus cupos. Se agregan uno por uno o pegando una lista
(`saludo | nombres para buscar | cupos | teléfono`, una línea cada uno).

Cada invitación tiene además su **link personal** (`…/?i=k7f3q9mx`, código
al azar). Con él, la tarjeta de entrada va dirigida a ese invitado y la
confirmación llega con su nombre y cupos puestos. El panel copia el link o
lo manda por WhatsApp.

También sirve **el link general**: el invitado escribe su
nombre y apellido; si está en la lista se le saluda ("¡Hola, Familia
Pérez!") y puede confirmar hasta sus cupos. Si no está, se le ofrece
escribir por WhatsApp. Si vuelve a responder, su respuesta se reemplaza.
Mientras la lista esté vacía, cualquiera puede confirmar.

El panel muestra quién asiste, quién no y quién falta por responder (con
botón para mandarle la invitación por WhatsApp), las canciones sugeridas y
las restricciones de comida, y lo descarga todo a Excel.

Cada respuesta se guarda en MySQL (`public/api/confirmar.php`). Si el servidor fallara, el invitado recibe un enlace a WhatsApp con su
respuesta ya escrita, para que nunca quede atascado.

## Fotos de los invitados

El día de la boda aparece la sección **"Comparte tus fotos"** (`#fotos`):
cada invitado sube fotos desde su celular, sin cuenta. Antes de ese día la
sección avisa que se abrirá; después, agradece. Las fechas y los topes se
fijan en `config.php` › `fotos`:

- ventana `desde` / `hasta`,
- máximo por foto (`max_mb`), fotos por persona por hora (`por_hora`),
- tope total de fotos (`max_fotos`) y de espacio (`max_total_mb`).

El celular achica cada foto antes de subirla (~0,5 MB) y sube de a una. El
servidor revisa que sea una imagen de verdad y la guarda **fuera de
public_html**, en `fotos-invitados/`: solo se ven desde el panel ›
**Fotos**, donde se pueden borrar, descargar en ZIP (por partes) e imprimir
un QR para las mesas.

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
  config/event.config.ts   ← todo el contenido (incluye el menú)
  lib/          calendar · whatsapp · analytics
  components/   Sobre · Musica · Foto · Ornamentos · Iconos · Aparecer · Confeti
    secciones/  Portada · Fecha · ConAmor · Programa · DressCode
                Menu · Cita · Lugar · Galeria · FotosInvitados · Confirmar · Cierre
public/
  api/          buscar.php · confirmar.php · fotos.php · _base.php  (PHP)
  panel/        index.php · exportar.php · foto.php · fotos-zip.php  (PHP)
  fotos/  music/
servidor/       plantilla de config y herramientas locales (las tablas se crean solas)
```

## Accesibilidad y rendimiento

- `prefers-reduced-motion` desactiva las animaciones y el scroll suave.
- Fuentes autoalojadas (Cormorant Garamond y Pinyon Script).
- Imágenes con `loading="lazy"`; el audio con `preload="none"`.
- Visor de galería con teclado (← → Esc) y deslizamiento con el dedo.
