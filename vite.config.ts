import fs from 'fs';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Los audios ambientales se sirven como archivos estáticos desde /assets/audio.
// En dev Vite ya los expone desde la raíz del proyecto; en build hay que copiarlos
// tal cual (son demasiado pesados para pasar por el bundler).
const copyAudioAssets = (): Plugin => ({
  name: 'neurobreak-copy-audio-assets',
  apply: 'build',
  closeBundle() {
    const source = path.resolve(__dirname, 'assets/audio');
    if (!fs.existsSync(source)) return;
    fs.cpSync(source, path.resolve(__dirname, 'dist/assets/audio'), {
      recursive: true,
      // No reescribimos archivos ya copiados: son cientos de MB y no cambian entre builds.
      force: false,
      errorOnExist: false,
    });
  },
});

export default defineConfig(() => {
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  return {
    server: {
      port: 3000,
      host: true,
      allowedHosts: true as true,
      headers: securityHeaders,
    },
    preview: {
      headers: securityHeaders,
    },
    plugins: [react(), copyAudioAssets()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
