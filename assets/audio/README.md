# Audio de NeuroBreak

- `ambient/`: paisajes sonoros suaves que reproduce el botón de música (esquina inferior derecha).
- `notifications/`: avisos no intrusivos para alertas de bienestar, pausas o recordatorios.
- `feedback/`: sonidos cortos de interacción, confirmaciones y logros.

Mantén los archivos optimizados para escritorio (por ejemplo, `.mp3`, `.ogg` o `.wav`) y usa nombres en minúsculas, sin espacios ni tildes: el nombre del archivo forma parte de la URL.

## Añadir un sonido ambiental

1. Copia el archivo en `ambient/`.
2. Regístralo en `src/constants/ambientSounds.ts` (id, etiqueta en ES/EN, icono de Material Symbols y ruta).

Los audios no pasan por el bundler: se sirven como archivos estáticos desde `/assets/audio/…` y se transmiten bajo demanda. En `npm run build` los copia a `dist/` el plugin `neurobreak-copy-audio-assets` de `vite.config.ts`.
