# Música

Deja aquí el archivo y apunta la ruta en `src/config/event.config.ts`:

```ts
musica: {
  src: "/music/event-song.mp3",
  titulo: "Nombre de la canción",
  artista: "Artista",
}
```

Recomendaciones:

- **MP3 a 128 kbps** basta y sobra para música de fondo. Un archivo de 4 MB
  tarda demasiado en una conexión móvil.
- Recórtala a los 60–90 segundos que mejor suenen: se reproduce en bucle.
- El reproductor usa `preload="none"`, así que el audio no se descarga hasta
  que el invitado entra. No penaliza la carga inicial.

Si no hay archivo, el reproductor no se muestra: no queda un botón que
no hace nada.
