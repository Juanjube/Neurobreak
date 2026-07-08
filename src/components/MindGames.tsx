import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIND_GAME_LIBRARY } from '../constants/mindGames';
import { MindGame, MindGameSession, User } from '../types';
import { getMindGameHistory, logMindGameSession } from '../services/supabase';

interface MindGamesProps {
  user: User;
  onCompleteGame: (game: MindGame, score: number | null, duration: number, variantSeed: string) => Promise<void>;
  t: (key: any) => string;
  lang: string;
}

type GameResult = {
  score: number | null;
  duration: number;
  summary: string;
};

type FinishedGame = {
  game: MindGame;
  score: number | null;
  duration: number;
  summary: string;
  quote: string;
};

const REFLECTIONS = {
  en: [
    'A calm mind is not empty; it is available.',
    'Small pauses teach attention where to rest.',
    'Clarity often arrives after the nervous system exhales.',
    'The mind works best when it is allowed to soften first.'
  ],
  es: [
    'Una mente tranquila no esta vacia; esta disponible.',
    'Las pausas pequenas ensenan a la atencion donde descansar.',
    'La claridad suele llegar despues de que el sistema nervioso exhala.',
    'La mente trabaja mejor cuando primero puede suavizarse.'
  ]
};

const createSeed = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededRandom = (seed: string) => {
  let value = hashSeed(seed) || 1;
  return () => {
    value = Math.imul(value ^ (value >>> 15), 1 | value);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = <T,>(items: T[], random: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickRecommendedGame = (history: MindGameSession[]) => {
  if (MIND_GAME_LIBRARY.length <= 1) return MIND_GAME_LIBRARY[0];

  const recentIds = history.slice(0, 3).map(session => session.game_id);
  const freshGames = MIND_GAME_LIBRARY.filter(game => !recentIds.includes(game.id));
  const candidates = freshGames.length > 0
    ? freshGames
    : MIND_GAME_LIBRARY.filter(game => game.id !== history[0]?.game_id);
  const pool = candidates.length > 0 ? candidates : MIND_GAME_LIBRARY;

  return pool[Math.floor(Math.random() * pool.length)];
};

const formatDuration = (seconds: number, lang: string) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}${lang === 'es' ? ' min' : 'm'}`;
};

const scoreText = (score: number | null) => score === null ? '--' : `${score}/100`;

const MindGames: React.FC<MindGamesProps> = ({ user, onCompleteGame, t, lang }) => {
  const [history, setHistory] = useState<MindGameSession[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeGame, setActiveGame] = useState<MindGame | null>(null);
  const [variantSeed, setVariantSeed] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [finishedGame, setFinishedGame] = useState<FinishedGame | null>(null);

  const recommendedGame = useMemo(() => pickRecommendedGame(history), [history]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const { data, error } = await getMindGameHistory(user.id, 20);
      if (error) throw error;
      setHistory((data || []) as MindGameSession[]);
    } catch (error) {
      console.error(error);
      setHistoryError(lang === 'es'
        ? 'No se pudo cargar el historial. Revisa que la tabla mental_game_history exista en Supabase.'
        : 'Could not load history. Check that mental_game_history exists in Supabase.');
    } finally {
      setLoadingHistory(false);
    }
  }, [lang, user.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startGame = (game: MindGame) => {
    setActiveGame(game);
    setFinishedGame(null);
    setVariantSeed(createSeed());
    setStartedAt(Date.now());
    setResultMessage('');
  };

  const startAnother = () => {
    startGame(pickRecommendedGame(history));
  };

  const completeGame = async ({ score, duration, summary }: GameResult) => {
    if (!activeGame || !startedAt) return;

    const elapsed = Math.max(10, Math.round((Date.now() - startedAt) / 1000));
    const safeDuration = Math.max(duration, elapsed);
    const quotePool = lang === 'es' ? REFLECTIONS.es : REFLECTIONS.en;
    const quote = quotePool[Math.floor(seededRandom(variantSeed)() * quotePool.length)];
    const completedGame = activeGame;

    setSaving(true);
    setResultMessage('');
    try {
      await logMindGameSession(user.id, completedGame.id, score, safeDuration, variantSeed);
      await onCompleteGame(completedGame, score, safeDuration, variantSeed);
      setFinishedGame({
        game: completedGame,
        score,
        duration: safeDuration,
        summary,
        quote
      });
      setActiveGame(null);
      setVariantSeed('');
      setStartedAt(null);
      await loadHistory();
    } catch (error) {
      console.error(error);
      setResultMessage(lang === 'es'
        ? 'No se pudo guardar la partida. Verifica la tabla de Supabase.'
        : 'Could not save the game. Check the Supabase table.');
    } finally {
      setSaving(false);
    }
  };

  const getGameTitle = (gameId: string) => MIND_GAME_LIBRARY.find(game => game.id === gameId)?.title || gameId;

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-content text-4xl font-black leading-tight tracking-tight">{t('mindGames')}</h1>
        <p className="text-[#92adc9] text-base">{t('mindGamesSubtitle')}</p>
      </div>

      {resultMessage && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-content">
          {resultMessage}
        </div>
      )}

      {finishedGame ? (
        <CompletionScreen
          result={finishedGame}
          onRepeat={() => startGame(finishedGame.game)}
          onAnother={startAnother}
          onBack={() => setFinishedGame(null)}
          t={t}
          lang={lang}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
          <section className="space-y-6">
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 overflow-hidden relative">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="size-14 rounded-xl bg-primary text-content flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-3xl">{recommendedGame.icon}</span>
                  </div>
                  <div>
                    <p className="text-primary text-xs font-black uppercase tracking-widest">{t('recommendedMindGame')}</p>
                    <h2 className="text-content text-2xl font-black mt-1">{recommendedGame.title}</h2>
                    <p className="text-[#c4d3e2] text-sm leading-relaxed mt-2 max-w-2xl">{recommendedGame.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => startGame(recommendedGame)}
                  className="h-12 px-5 rounded-xl bg-primary text-content text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl">play_circle</span>
                  {t('playRecommended')}
                </button>
              </div>
            </div>

            {activeGame ? (
              <div className="rounded-2xl border border-[#324d67] bg-card-dark p-6">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">{t('activeMindGame')}</p>
                    <h2 className="text-content text-2xl font-bold">{activeGame.title}</h2>
                  </div>
                  <button
                    onClick={() => setActiveGame(null)}
                    className="size-10 rounded-xl bg-white/5 text-[#92adc9] hover:text-content hover:bg-white/10 flex items-center justify-center"
                    disabled={saving}
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <GameRunner
                  game={activeGame}
                  seed={variantSeed}
                  saving={saving}
                  onComplete={completeGame}
                  t={t}
                  lang={lang}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {MIND_GAME_LIBRARY.map(game => (
                  <button
                    key={game.id}
                    onClick={() => startGame(game)}
                    className="text-left bg-card-dark rounded-2xl border border-[#233648] p-5 flex flex-col gap-4 hover:border-primary hover:-translate-y-1 transition-all group"
                  >
                    <div className="size-12 rounded-xl bg-[#233648] text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-content transition-colors">
                      <span className="material-symbols-outlined text-2xl">{game.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-content font-bold text-lg">{game.title}</h3>
                      <p className="text-[#92adc9] text-xs leading-relaxed mt-1">{game.description}</p>
                    </div>
                    <div className="mt-auto pt-4 border-t border-[#233648] flex items-center justify-between">
                      <span className="text-accent-teal text-[10px] font-bold uppercase">{game.duration} {t('mindGameSession')}</span>
                      <span className="material-symbols-outlined text-primary">arrow_forward</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-[#233648] bg-card-dark p-6 h-fit">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">{t('mindGameHistory')}</p>
                <h2 className="text-content text-xl font-bold">{t('recentGames')}</h2>
              </div>
              <button
                onClick={startAnother}
                className="size-10 rounded-xl bg-primary/20 text-primary hover:bg-primary hover:text-content transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">shuffle</span>
              </button>
            </div>

            {loadingHistory && <p className="text-[#92adc9] text-sm">{t('loadingHistory')}</p>}
            {historyError && <p className="text-amber-300 text-xs leading-relaxed">{historyError}</p>}
            {!loadingHistory && !historyError && history.length === 0 && (
              <p className="text-[#92adc9] text-sm">{t('emptyMindGameHistory')}</p>
            )}
            <div className="space-y-3">
              {history.slice(0, 6).map(session => (
                <div key={session.id} className="rounded-xl border border-[#324d67] bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-content text-sm font-bold truncate">{getGameTitle(session.game_id)}</p>
                    <span className="text-accent-teal text-xs font-bold">{scoreText(session.score)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-[#92adc9]">
                    <span>{formatDuration(session.duration, lang)}</span>
                    <span>{new Date(session.completed_at).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US')}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

interface CompletionScreenProps {
  result: FinishedGame;
  onRepeat: () => void;
  onAnother: () => void;
  onBack: () => void;
  t: (key: any) => string;
  lang: string;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ result, onRepeat, onAnother, onBack, t, lang }) => (
  <section className="min-h-[520px] rounded-2xl border border-[#233648] bg-[#07111d] px-6 py-10 flex flex-col items-center justify-center text-center">
    <div className="size-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-6">
      <span className="material-symbols-outlined text-4xl">auto_awesome</span>
    </div>
    <p className="text-[#92adc9] text-xs font-black uppercase tracking-[0.28em]">{t('sessionComplete')}</p>
    <h2 className="text-content text-3xl md:text-5xl font-black mt-3 max-w-3xl">{result.game.title}</h2>
    <p className="text-accent-cyan text-lg md:text-xl leading-relaxed mt-8 max-w-2xl">"{result.quote}"</p>
    <p className="text-[#92adc9] text-sm leading-relaxed mt-5 max-w-xl">{result.summary}</p>

    <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
      <div className="rounded-xl bg-white/5 border border-[#233648] p-4">
        <p className="text-[#92adc9] text-xs uppercase font-bold">{t('score')}</p>
        <p className="text-content text-2xl font-black mt-1">{scoreText(result.score)}</p>
      </div>
      <div className="rounded-xl bg-white/5 border border-[#233648] p-4">
        <p className="text-[#92adc9] text-xs uppercase font-bold">{t('duration')}</p>
        <p className="text-content text-2xl font-black mt-1">{formatDuration(result.duration, lang)}</p>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-xl">
      <button onClick={onBack} className="h-12 flex-1 rounded-xl bg-white/5 text-[#c4d3e2] text-sm font-bold hover:bg-white/10 transition-colors">
        {t('backToGames')}
      </button>
      <button onClick={onRepeat} className="h-12 flex-1 rounded-xl bg-[#233648] text-content text-sm font-bold hover:bg-[#2d455c] transition-colors">
        {t('repeatGame')}
      </button>
      <button onClick={onAnother} className="h-12 flex-1 rounded-xl bg-primary text-content text-sm font-bold hover:bg-primary/90 transition-colors">
        {t('playAnother')}
      </button>
    </div>
  </section>
);

interface GameRunnerProps {
  game: MindGame;
  seed: string;
  saving: boolean;
  onComplete: (result: GameResult) => void;
  t: (key: any) => string;
  lang: string;
}

const GameRunner: React.FC<GameRunnerProps> = ({ game, seed, saving, onComplete, t, lang }) => {
  if (game.category === 'Memory') {
    return <VisualMemoryGame seed={seed} saving={saving} onComplete={onComplete} t={t} lang={lang} />;
  }
  if (game.category === 'Pattern') {
    return <PatternGame seed={seed} saving={saving} onComplete={onComplete} t={t} lang={lang} />;
  }
  return <FocusBreathingGame saving={saving} onComplete={onComplete} t={t} lang={lang} />;
};

const VisualMemoryGame: React.FC<Omit<GameRunnerProps, 'game'>> = ({ seed, saving, onComplete, t, lang }) => {
  const random = useMemo(() => seededRandom(seed), [seed]);
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [locked, setLocked] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt] = useState(Date.now());
  const completedRef = useRef(false);

  const finish = useCallback((finalLevel: number, finalMistakes: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const accuracy = Math.max(0, 100 - finalMistakes * 18);
    const progress = Math.min(100, finalLevel * 12);
    const score = Math.round((accuracy * 0.55) + (progress * 0.45));
    onComplete({
      score: Math.min(100, score),
      duration: Math.max(10, Math.round((Date.now() - startedAt) / 1000)),
      summary: lang === 'es'
        ? `Llegaste al nivel ${finalLevel} con ${finalMistakes} errores.`
        : `You reached level ${finalLevel} with ${finalMistakes} mistakes.`
    });
  }, [lang, onComplete, startedAt]);

  const buildSequence = useCallback((targetLevel: number) => (
    Array.from({ length: targetLevel + 2 }, () => Math.floor(random() * 9))
  ), [random]);

  const showSequence = useCallback(async (nextSequence: number[]) => {
    setLocked(true);
    setInputIndex(0);
    await new Promise(resolve => setTimeout(resolve, 450));
    for (const cell of nextSequence) {
      if (completedRef.current) return;
      setActiveCell(cell);
      await new Promise(resolve => setTimeout(resolve, 520));
      setActiveCell(null);
      await new Promise(resolve => setTimeout(resolve, 180));
    }
    setLocked(false);
  }, []);

  useEffect(() => {
    const nextSequence = buildSequence(level);
    setSequence(nextSequence);
    showSequence(nextSequence);
  }, [buildSequence, level, showSequence]);

  const chooseCell = (cell: number) => {
    if (locked || saving || completedRef.current) return;

    if (cell !== sequence[inputIndex]) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setInputIndex(0);
      if (nextMistakes >= 3) {
        finish(level, nextMistakes);
        return;
      }
      showSequence(sequence);
      return;
    }

    const nextInputIndex = inputIndex + 1;
    if (nextInputIndex >= sequence.length) {
      if (level >= 6) {
        finish(level, mistakes);
        return;
      }
      setLevel(prev => prev + 1);
      return;
    }

    setInputIndex(nextInputIndex);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest">
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1">{t('level')} {level}</span>
        <span className="rounded-full bg-red-500/10 text-red-300 px-3 py-1">{t('mistakes')} {mistakes}/3</span>
        <span className="rounded-full bg-white/5 text-[#92adc9] px-3 py-1">{locked ? t('watchSequence') : t('repeatSequence')}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        {Array.from({ length: 9 }, (_, index) => (
          <button
            key={index}
            disabled={locked || saving}
            onClick={() => chooseCell(index)}
            className={`aspect-square rounded-xl border transition-all duration-200 ${
              activeCell === index
                ? 'bg-primary shadow-lg shadow-primary/40 border-primary scale-95'
                : 'bg-white/5 border-[#324d67] hover:border-primary hover:bg-primary/10'
            } disabled:cursor-default`}
          />
        ))}
      </div>
    </div>
  );
};

const PatternGame: React.FC<Omit<GameRunnerProps, 'game'>> = ({ seed, saving, onComplete, t, lang }) => {
  const randomRef = useRef(seededRandom(seed));
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [hits, setHits] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [round, setRound] = useState(() => createPatternRound(randomRef.current));
  const completedRef = useRef(false);

  const finish = useCallback((finalHits: number, finalMistakes: number) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const rawScore = finalHits * 10 - finalMistakes * 5;
    onComplete({
      score: Math.max(0, Math.min(100, rawScore)),
      duration: 60,
      summary: lang === 'es'
        ? `${finalHits} aciertos y ${finalMistakes} errores en una busqueda visual suave.`
        : `${finalHits} hits and ${finalMistakes} misses in a gentle visual search.`
    });
  }, [lang, onComplete]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      finish(hits, mistakes);
      return;
    }
    const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [finish, hits, mistakes, secondsLeft]);

  const choose = (index: number) => {
    if (saving || completedRef.current) return;
    if (index === round.oddIndex) {
      setHits(prev => prev + 1);
      setRound(createPatternRound(randomRef.current));
    } else {
      setMistakes(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest">
        <span className="rounded-full bg-accent-teal/10 text-accent-teal px-3 py-1">{t('hits')} {hits}</span>
        <span className="rounded-full bg-red-500/10 text-red-300 px-3 py-1">{t('mistakes')} {mistakes}</span>
        <span className="rounded-full bg-white/5 text-[#92adc9] px-3 py-1">{secondsLeft}s</span>
      </div>
      <div className="grid grid-cols-6 gap-2 max-w-xl mx-auto">
        {Array.from({ length: 36 }, (_, index) => {
          const isOdd = index === round.oddIndex;
          return (
            <button
              key={`${round.key}-${index}`}
              disabled={saving}
              onClick={() => choose(index)}
              className="aspect-square rounded-lg bg-white/5 border border-[#263d52] text-primary hover:bg-primary/10 hover:border-primary transition-all flex items-center justify-center"
            >
              <span
                className="material-symbols-outlined text-2xl transition-transform"
                style={{
                  transform: isOdd ? round.oddTransform : 'none',
                  color: isOdd && round.oddColor ? '#22d3ee' : undefined
                }}
              >
                {isOdd ? round.oddIcon : round.baseIcon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const createPatternRound = (random: () => number) => {
  const baseOptions = ['radio_button_unchecked', 'change_history', 'crop_square'];
  const baseIcon = baseOptions[Math.floor(random() * baseOptions.length)];
  const oddIcon = random() > 0.55 ? (baseIcon === 'change_history' ? 'navigation' : 'change_history') : baseIcon;
  const oddIndex = Math.floor(random() * 36);
  const transforms = ['rotate(45deg)', 'rotate(90deg)', 'scale(0.72)', 'scale(1.18)'];

  return {
    key: `${oddIndex}-${Date.now()}-${Math.floor(random() * 10000)}`,
    baseIcon,
    oddIcon,
    oddIndex,
    oddTransform: transforms[Math.floor(random() * transforms.length)],
    oddColor: random() > 0.5
  };
};

const FocusBreathingGame: React.FC<Omit<GameRunnerProps, 'game' | 'seed'>> = ({ saving, onComplete, t, lang }) => {
  const phases = useMemo(() => [
    { key: 'inhale', label: t('breatheIn'), scale: 1.18 },
    { key: 'holdFull', label: t('holdBreath'), scale: 1.18 },
    { key: 'exhale', label: t('breatheOut'), scale: 0.72 },
    { key: 'holdEmpty', label: t('holdBreath'), scale: 0.72 }
  ], [t]);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete({
      score: 100,
      duration: 60,
      summary: lang === 'es'
        ? 'Completaste una pausa de respiracion consciente.'
        : 'You completed a mindful breathing pause.'
    });
  }, [lang, onComplete]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      finish();
      return;
    }

    const interval = setInterval(() => setSecondsLeft(prev => prev - 1), 1000);

    return () => clearInterval(interval);
  }, [finish, secondsLeft]);

  useEffect(() => {
    const interval = setInterval(() => setPhaseIndex(prev => (prev + 1) % phases.length), 4000);
    return () => clearInterval(interval);
  }, [phases.length]);

  const phase = phases[phaseIndex];

  return (
    <div className="flex flex-col items-center gap-7 py-4">
      <div className="relative size-72 flex items-center justify-center">
        <div className="absolute inset-8 rounded-full border border-primary/20" />
        <div
          className="size-44 rounded-full bg-primary/30 border border-primary/70 flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform duration-[3800ms] ease-in-out"
          style={{ transform: `scale(${phase.scale})` }}
        >
          <span className="text-content text-xl font-black">{phase.label}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
        <span className="rounded-full bg-white/5 text-[#92adc9] px-3 py-1">{lang === 'es' ? `${secondsLeft}s restantes` : `${secondsLeft}s left`}</span>
        <span className="rounded-full bg-primary/10 text-primary px-3 py-1">4s</span>
      </div>
      <button
        disabled={saving}
        onClick={finish}
        className="h-11 px-5 rounded-xl bg-accent-teal text-content text-sm font-bold hover:bg-accent-teal/90 transition-colors"
      >
        {t('finishMindGame')}
      </button>
    </div>
  );
};

export default MindGames;
