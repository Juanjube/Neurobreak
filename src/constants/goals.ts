import { translations } from './translations';

// Identificadores canónicos del objetivo. Es lo único que se guarda en la base de datos:
// las etiquetas visibles se traducen al vuelo, así el objetivo se lee en el idioma del usuario.
export const GOAL_IDS = ['deep_work', 'creative_flow', 'spinal_recovery', 'vagus_nerve'] as const;

export type GoalId = (typeof GOAL_IDS)[number];

export interface GoalOption {
  id: GoalId;
  translationKey: keyof typeof translations['en'];
  icon: string;
}

export const GOALS: GoalOption[] = [
  { id: 'deep_work', translationKey: 'goalDeepWork', icon: 'target' },
  { id: 'creative_flow', translationKey: 'goalCreativeFlow', icon: 'lightbulb' },
  { id: 'spinal_recovery', translationKey: 'goalSpinalRecovery', icon: 'accessibility_new' },
  { id: 'vagus_nerve', translationKey: 'goalVagusNerve', icon: 'self_improvement' },
];

export const DEFAULT_GOAL_ID: GoalId = 'deep_work';

// Perfiles creados antes de usar identificadores guardaban la etiqueta en inglés
// (y una versión anterior del validador usaba otro juego de nombres). Los traducimos
// al id canónico al leerlos para no dejar cuentas antiguas bloqueadas.
const LEGACY_GOAL_ALIASES: Record<string, GoalId> = {
  'deep work optimization': 'deep_work',
  'deep work': 'deep_work',
  'creative flow state': 'creative_flow',
  'creative flow': 'creative_flow',
  'spinal & postural recovery': 'spinal_recovery',
  'spinal and postural recovery': 'spinal_recovery',
  'back health': 'spinal_recovery',
  'vagus nerve regulation': 'vagus_nerve',
  'stress management': 'vagus_nerve',
  'optimización de trabajo profundo': 'deep_work',
  'estado de flujo creativo': 'creative_flow',
  'recuperación espinal y postural': 'spinal_recovery',
  'regulación del nervio vago': 'vagus_nerve',
};

export const isGoalId = (value: unknown): value is GoalId =>
  typeof value === 'string' && (GOAL_IDS as readonly string[]).includes(value);

/**
 * Devuelve el id canónico de un objetivo. Si el valor no se reconoce lo deja tal cual
 * para que la validación pueda avisar con el texto original.
 */
export const normalizeGoal = (value: unknown): string => {
  if (typeof value !== 'string') return DEFAULT_GOAL_ID;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_GOAL_ID;
  if (isGoalId(trimmed)) return trimmed;
  return LEGACY_GOAL_ALIASES[trimmed.toLowerCase()] ?? trimmed;
};

/** Igual que normalizeGoal, pero siempre devuelve un id válido (para pintar en pantalla). */
export const toGoalId = (value: unknown): GoalId => {
  const normalized = normalizeGoal(value);
  return isGoalId(normalized) ? normalized : DEFAULT_GOAL_ID;
};

/** Etiqueta traducida del objetivo. */
export const goalLabel = (value: unknown, language: 'en' | 'es'): string => {
  const goal = GOALS.find((option) => option.id === toGoalId(value)) ?? GOALS[0];
  return translations[language][goal.translationKey];
};
