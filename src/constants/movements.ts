
import { Movement } from '../types';

export const MOVEMENT_LIBRARY: Movement[] = [
  {
    id: 'neck-1',
    title: 'Cervical Reset',
    description: 'Controlled rotations to decompress C1-C7 vertebrae.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'rotate_left',
    category: 'Spine',
    recommended: true,
    neuroBenefit: 'Increases blood flow to the cerebellum.',
    intensity: 'Low'
  },
  {
    id: 'eye-1',
    title: '20-20-20 Relief',
    description: 'Focus reset for digital eye strain.',
    duration: '1m',
    durationSeconds: 60,
    icon: 'visibility',
    category: 'Eyes',
    neuroBenefit: 'Reduces optic nerve fatigue.',
    intensity: 'Low'
  },
  {
    id: 'spine-1',
    title: 'Thoracic Bridge',
    description: 'Deep extension for hunched posture correction.',
    duration: '4m',
    durationSeconds: 240,
    icon: 'accessibility',
    category: 'Spine',
    recommended: true,
    neuroBenefit: 'Vagus nerve stimulation.',
    intensity: 'Medium'
  },
  {
    id: 'breath-1',
    title: 'Box Breathing',
    description: 'Tactical breathing for high-stress moments.',
    duration: '3m',
    durationSeconds: 180,
    icon: 'air',
    category: 'Focus',
    neuroBenefit: 'Instant cortisol regulation.',
    intensity: 'Low'
  },
  {
    id: 'energy-1',
    title: 'Neural Pulse',
    description: 'Quick micro-movements to wake up the CNS.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'bolt',
    category: 'Energy',
    neuroBenefit: 'Dopamine baseline reset.',
    intensity: 'High'
  },
  {
    id: 'wrist-1',
    title: 'Carpal Glide',
    description: 'Tendon gliding exercises for heavy typing users.',
    duration: '3m',
    durationSeconds: 180,
    icon: 'pan_tool',
    category: 'Decompression',
    neuroBenefit: 'Prevents median nerve compression.',
    intensity: 'Low'
  }
];
