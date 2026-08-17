# Aaron & Jasne

Invitación digital. React + TypeScript + Vite · Tailwind v4 · Framer Motion · Supabase.

```bash
npm install
npm run dev      # http://localhost:4400
```

Sin variables de entorno el sitio corre completo en **modo demostración**: se
navega entero y los formularios validan, pero nada se guarda. Sirve para
revisar y aprobar el diseño antes de montar la base.

---

## Qué hay que completar

El encargo fue explícito en no inventar datos. Todo lo que no sabíamos quedó
marcado como `PENDIENTE` en `src/config/event.config.ts` y la interfaz se
comporta distinto mientras siga así — no muestra un dato falso, muestra
"por confirmar".

| Dato | Dónde | Estado |
|---|---|---|
| Día exacto de enero | `fecha.iso` + `fecha.confirmada` | estimado |
| Lugar, dirección, mapa | `lugar.*` | vacío |
| WhatsApp de contacto | `whatsapp.numero` | vacío |
| Historia (4 capítulos) | `historia[]` | texto de muestra |
| Fotografías | `fotos.*`, `galeria[]` | sin fotos |
| Canción | `public/music/` | sin archivo |
| Imagen para compartir | `public/og.jpg` (1200×630) | falta |
| Iconos PWA | `public/icono-192.png`, `icono-512.png` | faltan |

**La fecha manda sobre la interfaz.** Con `confirmada: false` el sitio dice
"Enero 2027 · fecha por confirmar", la cuenta regresiva se anuncia como
estimada y "El gran día" no muestra número de día. Al poner el ISO real y
`confirmada: true`, todo eso cambia solo. No hay que tocar nada más.

---

## Base de datos

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. SQL Editor → pega y ejecuta `supabase/schema.sql` completo
3. Copia `URL` y `anon key` a `.env.local` (ver `.env.example`)
4. Authentication › Users → crea el usuario del panel
5. Copia su UID y ejecuta:

```sql
insert into public.admin_users (id, email)
values ('EL-UID', 'correo@ejemplo.cl');
```

Sin el paso 5 nadie entra a `/admin`, aunque tenga cuenta.

### Sobre la seguridad

Esta es una aplicación que corre entera en el navegador, así que la `anon key`
es pública por diseño y va en el bundle. **Lo que protege los datos son las
políticas RLS**, no esconder la clave:

- cualquiera puede **escribir** una confirmación
- **nadie** puede leer la lista de invitados sin sesión de administrador
- el contenido público (cronograma, galería) se lee libre y solo lo edita un admin

Es decir: alguien con la anon key puede confirmar asistencia —igual que desde
el formulario— pero no puede extraer los teléfonos ni los mensajes.

Nunca pongas la `service_role` key en este proyecto.

---

## Panel · `/admin`

- **Resumen** — personas confirmadas, acompañantes, tasa de sí, últimas
  respuestas, restricciones alimentarias
- **Invitados** — tabla con filtros y búsqueda, editar, eliminar, cambiar
  estado, agregar a mano, exportar CSV
- **Mensajes** — plantillas con variables `{{nombre}}`, `{{fecha}}`,
  `{{lugar}}`, `{{hora}}`, `{{acompanantes}}`; envío individual o por grupo
- **Configuración** — fecha, lugar, mapa, WhatsApp, frase, canción

### Sobre WhatsApp, dicho sin adornos

El panel **no envía mensajes solo**. No hay WhatsApp Business API contratada,
así que lo que hace es abrir WhatsApp con el mensaje ya escrito, uno por
invitado, y la persona pulsa enviar. Toda la interfaz está redactada así
—"preparar", "abrir"— para no prometer un envío automático que no existe.

Cuando se contrate la API oficial, el único punto a cambiar es `abrirUno` en
`src/admin/Mensajes.tsx`: las plantillas, las variables y la selección de
destinatarios ya están resueltas.

---

## Estructura

```
src/
  config/event.config.ts   ← todo el contenido editable
  lib/          supabase · calendar · whatsapp · analytics
  hooks/        cuenta regresiva · movimiento reducido · magnético
  components/   Portal · Musica · Cursor · Navegacion · Confeti · Marca · Revelar
    secciones/  Portada · Cuenta · Historia · Galeria · GranDia
                Cronograma · Llegar · Confirmar · Cierre
  admin/        AdminApp · Login · Resumen · Invitados · Mensajes · Ajustes
supabase/schema.sql
```

El panel viaja en su propio chunk (~30 kB) y solo se descarga al visitar
`/admin`: un invitado no paga el peso de la administración.

## Analítica

Sin `VITE_GA_ID` no se carga ningún script de rastreo ni se hace ninguna
petición. Con ID configurado se miden: entrada a la experiencia, música,
RSVP iniciado/completado, clics a WhatsApp, mapa y calendario, y aperturas
de galería.

## Accesibilidad y rendimiento

- `prefers-reduced-motion` desactiva partículas, cursor propio, scroll suave,
  confeti y acorta la secuencia de entrada
- El cursor propio solo se monta con puntero fino; el del sistema nunca se
  oculta si el componente no está
- Fuentes autoalojadas: cero peticiones a terceros
- Imágenes con `loading="lazy"`; el audio con `preload="none"`
- Lightbox con teclado completo (← → Esc) y bloqueo de scroll de fondo

## Despliegue

`vercel.json` ya trae las reescrituras de SPA (sin ellas `/admin` daría 404),
las cabeceras de seguridad y el cacheo de assets. Agrega las variables de
entorno en Vercel y despliega.
