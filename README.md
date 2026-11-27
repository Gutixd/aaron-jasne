# Aaron & Jasne

Invitación digital. React + TypeScript + Vite · Tailwind v4 · Framer Motion.
Sin servidor ni base de datos: todo el contenido vive en
`src/config/event.config.ts` y las confirmaciones llegan por WhatsApp.

## Verla en local

Doble clic en **`Abrir invitacion.bat`**, o desde una terminal:

```bash
npm install
npm run dev      # abre http://localhost:4410
```

---

## Qué hay que completar

Hay dos tipos de marca en `src/config/event.config.ts`:

- **`PENDIENTE`** — dato real que todavía no se sabe. La interfaz muestra
  "por confirmar" en vez de un dato falso.
- **`FICTICIO`** — contenido de ejemplo puesto para ver el diseño completo.
  Hay que reemplazarlo antes de mandar la invitación.

| Dato | Dónde | Estado |
|---|---|---|
| Día exacto de enero | `fecha.iso` + `fecha.confirmada` | pendiente |
| Lugar, dirección, mapa, coordenadas, notas | `lugar.*` | ficticio |
| Historia (4 capítulos) | `historia[]` | ficticio |
| Fotografías | `fotos.*`, `galeria[]` | ficticio (Picsum) |
| Dress code, contactos | `dressCode`, `contacto` | ficticio |
| WhatsApp | `whatsapp.numero` | real |
| Canción | `public/music/event-song.mp3` | real |
| Imagen para compartir | `public/og.jpg` (1200×630) | falta |
| Iconos | `public/icono-192.png`, `icono-512.png` | faltan |

**La fecha manda sobre la interfaz.** Con `confirmada: false` el sitio dice
"Enero 2027 · fecha por confirmar", la cuenta regresiva se anuncia como
estimada y "El gran día" no muestra número de día. Al poner el ISO real y
`confirmada: true`, todo eso cambia solo.

**Las fotos de ejemplo vienen de picsum.photos**, un servicio externo. Antes de
mandar la invitación, pon las reales en `public/fotos/` y cambia cada `src`.

---

## Confirmaciones

Al enviar el formulario se abre WhatsApp con la respuesta completa ya escrita
(asistencia, acompañantes, alimentación, teléfono y mensaje) dirigida al número
de `whatsapp.numero`. El invitado pulsa enviar y la respuesta llega al chat.

Nada se envía solo y no queda guardado en ningún servidor: el registro de
quién confirmó es ese chat de WhatsApp.

---

## Estructura

```
src/
  config/event.config.ts   ← todo el contenido editable
  lib/          calendar · whatsapp · analytics
  hooks/        cuenta regresiva · movimiento reducido · magnético
  components/   Portal · Carta · Mapa · Musica · Cursor · Navegacion
                Confeti · Marca · Revelar
    secciones/  Portada · Cuenta · Historia · Galeria · GranDia
                Cronograma · Llegar · Confirmar · Cierre
```

## Analítica

Sin `VITE_GA_ID` no se carga ningún script de rastreo ni se hace ninguna
petición. Con ID configurado se miden: entrada a la experiencia, música,
confirmaciones, clics a WhatsApp, mapa y calendario, y aperturas de galería.

## Accesibilidad y rendimiento

- `prefers-reduced-motion` desactiva partículas, cursor propio, scroll suave,
  confeti y acorta la secuencia de entrada
- El cursor propio solo se monta con puntero fino
- Fuentes autoalojadas
- Imágenes con `loading="lazy"`; el audio con `preload="none"`
- Visor de galería con teclado completo (← → Esc)

## Publicarla

`npm run build` deja el sitio en `dist/`: son archivos estáticos que se pueden
subir a cualquier hosting. **No sirve abrir `dist/index.html` con doble clic**:
el navegador bloquea los módulos JavaScript desde archivos locales. Para verla
en el equipo usa `npm run dev` o `npm run preview`.
