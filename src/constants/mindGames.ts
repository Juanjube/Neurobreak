import { MindGame } from '../types';
import numberSequenceIcon from '../../assets/images/icons/number-sequence.svg';
import changeDetectionIcon from '../../assets/images/icons/change-detection.svg';
import calmReflexIcon from '../../assets/images/icons/calm-reflex.svg';
import mirrorBreathingIcon from '../../assets/images/icons/mirror-breathing.svg';

export const MIND_GAME_LIBRARY: MindGame[] = [
  {
    id: 'memory-visual-1',
    title: 'Visual Memory',
    titleEs: 'Memoria Visual',
    description: 'Remember a short sequence of calming color cues.',
    descriptionEs: 'Recuerda una breve secuencia de señales visuales serenas.',
    duration: '1m',
    durationSeconds: 60,
    icon: 'memory',
    category: 'Memory',
    neuroBenefit: 'Refreshes working memory without high pressure.',
    difficulty: 'Easy'
  },
  {
    id: 'pattern-odd-1',
    title: 'Pattern Match',
    titleEs: 'Patrón Diferente',
    description: 'Find the one symbol that breaks the visual pattern.',
    descriptionEs: 'Encuentra el símbolo que rompe el patrón visual.',
    duration: '1m',
    durationSeconds: 60,
    icon: 'extension',
    category: 'Pattern',
    neuroBenefit: 'Gently shifts attention away from rumination.',
    difficulty: 'Easy'
  },
  {
    id: 'focus-breath-1',
    title: 'Focus Breathing',
    titleEs: 'Respiración de Enfoque',
    description: 'Follow a slow breathing rhythm to settle your focus.',
    descriptionEs: 'Sigue un ritmo lento para aquietar tu enfoque.',
    duration: '2m',
    durationSeconds: 90,
    icon: 'self_improvement',
    category: 'Focus',
    neuroBenefit: 'Supports calm attention and nervous system regulation.',
    difficulty: 'Easy'
  },
  {
    id: 'number-sequence-1',
    title: 'Number Sequence',
    titleEs: 'Secuencia Numérica',
    description: 'Repeat a short number sequence at your own calm pace.',
    descriptionEs: 'Repite una secuencia de números a tu propio ritmo.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'pin',
    iconAsset: numberSequenceIcon,
    category: 'Number',
    neuroBenefit: 'Builds working memory through gentle repetition.',
    difficulty: 'Easy'
  },
  {
    id: 'change-detection-1',
    title: 'Spot the Change',
    titleEs: 'Detecta el Cambio',
    description: 'Notice subtle differences between two quiet visual patterns.',
    descriptionEs: 'Encuentra diferencias sutiles entre dos patrones visuales.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'difference',
    iconAsset: changeDetectionIcon,
    category: 'Change',
    neuroBenefit: 'Practices sustained attention without visual urgency.',
    difficulty: 'Medium'
  },
  {
    id: 'calm-reflex-1',
    title: 'Calm Reflex',
    titleEs: 'Reflejo Sereno',
    description: 'Tap when a slowly changing color reaches the target tone.',
    descriptionEs: 'Toca cuando el color en transición alcance el tono objetivo.',
    duration: '1m',
    durationSeconds: 90,
    icon: 'track_changes',
    iconAsset: calmReflexIcon,
    category: 'Timing',
    neuroBenefit: 'Trains timing and precision with a calm visual rhythm.',
    difficulty: 'Medium'
  },
  {
    id: 'mirror-breathing-1',
    title: 'Mirror Breathing',
    titleEs: 'Respiración en Espejo',
    description: 'Match gentle taps to a 4-7-8 breathing rhythm.',
    descriptionEs: 'Sincroniza toques suaves con un ritmo de respiración 4-7-8.',
    duration: '2m',
    durationSeconds: 120,
    icon: 'airwave',
    iconAsset: mirrorBreathingIcon,
    category: 'Breathing',
    neuroBenefit: 'Pairs mindful breathing with light, restorative attention.',
    difficulty: 'Easy'
  }
];
