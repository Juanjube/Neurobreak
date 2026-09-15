import { Language } from '../types';

// Cada sonido ambiental vive en assets/audio/ambient y se sirve como archivo estático.
// No se importan con el bundler a propósito: son archivos grandes y deben transmitirse
// bajo demanda (streaming) en lugar de formar parte del bundle de JS.
export interface AmbientSound {
  id: string;
  // Etiqueta en ambos idiomas para no depender del diccionario global de traducciones.
  label: Record<Language, string>;
  // Icono de Material Symbols que acompaña al sonido en la lista.
  icon: string;
  src: string;
}

const AMBIENT_BASE_PATH = '/assets/audio/ambient';

export const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    label: { es: 'Lluvia suave', en: 'Gentle rain' },
    icon: 'rainy',
    src: `${AMBIENT_BASE_PATH}/rain.mp3`,
  },
  {
    id: 'waves',
    label: { es: 'Olas del mar', en: 'Ocean waves' },
    icon: 'waves',
    src: `${AMBIENT_BASE_PATH}/waves.mp3`,
  },
  {
    id: 'forest-night',
    label: { es: 'Noche en el bosque', en: 'Night in the forest' },
    icon: 'forest',
    src: `${AMBIENT_BASE_PATH}/forest-night.mp3`,
  },
  {
    id: 'birds',
    label: { es: 'Canto de pájaros', en: 'Birdsong' },
    icon: 'raven',
    src: `${AMBIENT_BASE_PATH}/birds.mp3`,
  },
  {
    id: 'fireplace',
    label: { es: 'Chimenea', en: 'Fireplace' },
    icon: 'fireplace',
    src: `${AMBIENT_BASE_PATH}/fireplace.mp3`,
  },
  {
    id: 'white-noise-water',
    label: { es: 'Ruido blanco (agua)', en: 'White noise (water)' },
    icon: 'water_drop',
    src: `${AMBIENT_BASE_PATH}/white-noise-water.mp3`,
  },
  {
    id: 'brown-noise',
    label: { es: 'Ruido marrón', en: 'Brown noise' },
    icon: 'graphic_eq',
    src: `${AMBIENT_BASE_PATH}/brown-noise.mp3`,
  },
];
