import { MindGame } from '../types';

export const MIND_GAME_LIBRARY: MindGame[] = [
  {
    id: 'memory-visual-1',
    title: 'Visual Memory',
    description: 'Remember a short sequence of calming color cues.',
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
    description: 'Find the one symbol that breaks the visual pattern.',
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
    description: 'Follow a slow breathing rhythm to settle your focus.',
    duration: '2m',
    durationSeconds: 90,
    icon: 'self_improvement',
    category: 'Focus',
    neuroBenefit: 'Supports calm attention and nervous system regulation.',
    difficulty: 'Easy'
  }
];
