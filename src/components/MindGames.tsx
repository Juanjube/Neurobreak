import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MIND_GAME_LIBRARY } from '../constants/mindGames';
import { MindGame, MindGameSession, User } from '../types';
import { getMindGameHistory, logMindGameSession } from '../services/supabase';
// Capa de persistencia agnóstica — NUNCA llamar a localStorage directamente aquí.
import { guardarEstado, leerEstado, limpiarEstado } from '../services/gameStateStorage';

interface MindGamesProps {
  user: User;
  onCompleteGame: (game: MindGame, score: number | null, duration: number, variantSeed: string) => Promise<void>;
  t: (key: any) => string;
  lang: string;
  categoryFilter?: string;
  onCategoryFilterChange?: (cat: string) => void;
}

type GameResult = { score: number | null; duration: number; summary: string };
type GameState = Record<string, unknown>;
const VISUAL_MEMORY_INITIAL_LENGTH = 3;
const VISUAL_MEMORY_MAX_LENGTH = 9;
const NUMBER_SEQUENCE_INITIAL_LENGTH = 4;
const NUMBER_SEQUENCE_MAX_LENGTH = 9;
const CHANGE_DETECTION_MAX_DIFFERENCES = 5;
const REFLEX_START_MARGIN = 0.22;
const REFLEX_MIN_MARGIN = 0.07;
const MAX_VISUAL_ROUND = VISUAL_MEMORY_MAX_LENGTH - VISUAL_MEMORY_INITIAL_LENGTH + 1;
const MAX_NUMBER_ROUND = NUMBER_SEQUENCE_MAX_LENGTH - NUMBER_SEQUENCE_INITIAL_LENGTH + 1;
const nameOf = (game: MindGame, lang: string) => lang === 'es' ? game.titleEs || game.title : game.title;
const descriptionOf = (game: MindGame, lang: string) => lang === 'es' ? game.descriptionEs || game.description : game.description;
const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const seeded = (seed: string) => { let n = 2166136261; for (const char of seed) { n ^= char.charCodeAt(0); n = Math.imul(n, 16777619); } return () => ((n = Math.imul(n ^ (n >>> 15), 1 | n)) >>> 0) / 4294967296; };
const wait = (lang: string) => lang === 'es' ? 'Tu turno' : 'Your turn';

function useSnapshot(state: GameState, onSnapshot: (state: GameState) => void) {
  const callback = useRef(onSnapshot);
  callback.current = onSnapshot;
  const encoded = JSON.stringify(state);
  useEffect(() => { callback.current(JSON.parse(encoded)); }, [encoded]);
}

const MindGames: React.FC<MindGamesProps> = ({ user, onCompleteGame, t, lang, categoryFilter, onCategoryFilterChange }) => {
  const [history, setHistory] = useState<MindGameSession[]>([]);
  const [activeGame, setActiveGame] = useState<MindGame | null>(null);
  const [seed, setSeed] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [gameState, setGameState] = useState<GameState>({});
  const [paused, setPaused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [localCategory, setLocalCategory] = useState<string>('All');
  const selectedCategory = categoryFilter !== undefined ? categoryFilter : localCategory;
  const handleCategoryChange = (cat: string) => {
    if (onCategoryFilterChange) {
      onCategoryFilterChange(cat);
    } else {
      setLocalCategory(cat);
    }
  };

  const categories = ['All', 'Memory', 'Focus', 'Pattern', 'Number', 'Change', 'Timing', 'Breathing'];

  // ── Ref guard: evita guardar antes de que se complete la restauración inicial ──
  const isRestoredRef = useRef(false);

  const loadHistory = useCallback(async () => {
    try {
      const { data, error } = await getMindGameHistory(user.id, 20);
      if (error) throw error;
      setHistory((data || []) as MindGameSession[]);
    } catch { setMessage(lang === 'es' ? 'El historial no está disponible por ahora.' : 'History is unavailable right now.'); }
  }, [lang, user.id]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Restauración al montar: verificar sesión guardada vía leerEstado() ──────
  useEffect(() => {
    if (activeGame) return;
    const pendingGame = MIND_GAME_LIBRARY.find(g => leerEstado(user.id, g.id) !== null);
    if (!pendingGame) { isRestoredRef.current = true; return; }
    const saved = leerEstado(user.id, pendingGame.id);
    if (!saved) { isRestoredRef.current = true; return; }
    setActiveGame(pendingGame);
    setSeed(saved.seed);
    setStartedAt(saved.startedAt);
    setGameState(saved.gameState);
    setPaused(true);
    isRestoredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeGame || !seed || !startedAt || !isRestoredRef.current) return;
    guardarEstado(user.id, activeGame.id, {
      gameState,
      round: (gameState.round as number) || 1,
      score: (gameState.score as number) || 0,
      seed,
      startedAt,
      paused,
    });
  }, [activeGame, gameState, paused, seed, startedAt, user.id]);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden && activeGame) setPaused(true); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [activeGame]);

  const start = (game: MindGame) => {
    setActiveGame(game); setSeed(uid()); setStartedAt(Date.now()); setGameState({}); setPaused(false); setMessage('');
  };

  const close = () => {
    if (activeGame) limpiarEstado(user.id, activeGame.id);
    setActiveGame(null); setGameState({}); setPaused(false);
  };

  const finish = async (result: GameResult) => {
    if (!activeGame || saving) return;
    setSaving(true);
    try {
      await logMindGameSession(user.id, activeGame.id, result.score, Math.max(10, result.duration), seed);
      await onCompleteGame(activeGame, result.score, Math.max(10, result.duration), seed);
      limpiarEstado(user.id, activeGame.id);
      setMessage(lang === 'es' ? `${nameOf(activeGame, lang)} completado: ${result.summary}` : `${nameOf(activeGame, lang)} completed: ${result.summary}`);
      setActiveGame(null); setGameState({}); setPaused(false); await loadHistory();
    } catch { setMessage(lang === 'es' ? 'No se pudo guardar la partida; tu progreso queda guardado localmente.' : 'The game could not be saved; your progress remains stored locally.'); }
    finally { setSaving(false); }
  };

  const bestVisualStreak = useMemo(() => Math.max(0, ...history.filter(item => item.game_id === 'memory-visual-1').map(item => Math.max(1, Math.round((item.score || 0) / 11)))), [history]);

  const filteredGames = selectedCategory === 'All' 
    ? MIND_GAME_LIBRARY 
    : MIND_GAME_LIBRARY.filter(g => g.category === selectedCategory);

  return <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
    <div><h1 className="text-content text-4xl font-black">{t('mindGames')}</h1><p className="text-[#92adc9] mt-2">{t('mindGamesSubtitle')}</p></div>
    {message && <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-content">{message}</div>}
    {activeGame ? <section className="rounded-2xl border border-[#324d67] bg-card-dark p-5 md:p-7">
      <div className="flex items-start justify-between gap-4 mb-6"><div><p className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">{t('activeMindGame')}</p><h2 className="text-content text-2xl font-bold mt-1">{nameOf(activeGame, lang)}</h2></div><button onClick={close} disabled={saving} className="size-10 rounded-xl bg-white/5 text-[#92adc9] hover:text-content"><span className="material-symbols-outlined">close</span></button></div>
      <GameRunner game={activeGame} seed={seed} state={gameState} paused={paused} saving={saving} bestVisualStreak={bestVisualStreak} onSnapshot={setGameState} onComplete={finish} lang={lang} />
      {paused && <div className="mt-6 rounded-xl border border-primary/30 bg-primary/10 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><p className="text-sm text-content">{lang === 'es' ? 'La sesión está pausada para cuidar tu progreso.' : 'This session is paused to protect your progress.'}</p><button onClick={() => setPaused(false)} className="h-10 px-5 rounded-xl bg-primary text-content text-sm font-bold">{lang === 'es' ? 'Reanudar' : 'Resume'}</button></div>}
    </section> : <>
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === cat 
                ? 'bg-primary border-primary text-content shadow-lg shadow-primary/20' 
                : 'border-[#233648] text-[#92adc9] hover:border-white/20'
            }`}
          >
            {cat === 'All' ? t('all') : cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{filteredGames.map(game => <button key={game.id} onClick={() => start(game)} className="text-left bg-card-dark rounded-2xl border border-[#233648] p-5 flex flex-col gap-4 hover:border-primary hover:-translate-y-1 transition-all group">
        <div className="size-12 rounded-xl bg-[#233648] text-primary flex items-center justify-center group-hover:bg-primary transition-colors">{game.iconAsset ? <img src={game.iconAsset} alt="" className="size-9" /> : <span className="material-symbols-outlined text-2xl">{game.icon}</span>}</div>
        <div><h3 className="text-content font-bold text-lg">{nameOf(game, lang)}</h3><p className="text-[#92adc9] text-xs leading-relaxed mt-1">{descriptionOf(game, lang)}</p></div>
        <div className="mt-auto pt-4 border-t border-[#233648] flex justify-between text-[10px] font-bold uppercase"><span className="text-accent-teal">{game.duration} {t('mindGameSession')}</span><span className="material-symbols-outlined text-primary">arrow_forward</span></div>
      </button>)}</div>
      <aside className="rounded-2xl border border-[#233648] bg-card-dark p-6"><p className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">{t('mindGameHistory')}</p><h2 className="text-content text-xl font-bold mt-1">{t('recentGames')}</h2><div className="grid md:grid-cols-3 gap-3 mt-5">{history.slice(0, 6).map(item => <div key={item.id} className="rounded-xl border border-[#324d67] bg-white/5 p-3"><p className="text-sm text-content font-bold truncate">{nameOf(MIND_GAME_LIBRARY.find(game => game.id === item.game_id) || { title: item.game_id } as MindGame, lang)}</p><p className="text-accent-teal text-[#92adc9] text-xs mt-2">{item.score ?? '--'}/100</p></div>)}{history.length === 0 && <p className="text-[#92adc9] text-sm">{t('emptyMindGameHistory')}</p>}</div></aside>
    </>}
  </div>;
};

interface RunnerProps { game: MindGame; seed: string; state: GameState; paused: boolean; saving: boolean; bestVisualStreak: number; onSnapshot: (state: GameState) => void; onComplete: (result: GameResult) => void; lang: string; }
const GameRunner: React.FC<RunnerProps> = props => {
  switch (props.game.id) {
    case 'memory-visual-1': return <VisualMemory {...props} />;
    case 'number-sequence-1': return <NumberSequence {...props} />;
    case 'change-detection-1': return <ChangeDetection {...props} />;
    case 'calm-reflex-1': return <CalmReflex {...props} />;
    case 'mirror-breathing-1': return <MirrorBreathing {...props} />;
    case 'pattern-odd-1': return <PatternMatch {...props} />;
    default: return <FocusBreathing {...props} />;
  }
};

const Pill = ({ children }: { children: React.ReactNode }) => <span className="rounded-full bg-white/5 text-[#c4d3e2] px-3 py-1 text-xs font-bold uppercase tracking-widest">{children}</span>;
const useSecondTick = (paused: boolean, update: () => void) => useEffect(() => { if (paused) return; const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer); }, [paused, update]);

const VisualMemory: React.FC<RunnerProps> = ({ state, paused, saving, bestVisualStreak, onSnapshot, onComplete, lang, seed }) => {
  type State = { round: number; sequence: number[]; display: number; mode: 'watch' | 'input'; input: number; elapsed: number; retried: boolean };
  const initial = (): State => { const raw = state as Partial<State>; const round = raw.round || 1; return { round, sequence: raw.sequence || makeSequence(`${seed}-visual-${round}`, VISUAL_MEMORY_INITIAL_LENGTH + round - 1, 9), display: raw.display || 0, mode: raw.mode || 'watch', input: raw.input || 0, elapsed: raw.elapsed || 0, retried: !!raw.retried }; };
  const [game, setGame] = useState<State>(initial); useSnapshot(game, onSnapshot);
  useSecondTick(paused, useCallback(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1 })), []));
  useEffect(() => { if (paused || game.mode !== 'watch') return; const timer = window.setTimeout(() => setGame(item => item.display + 1 < item.sequence.length ? { ...item, display: item.display + 1 } : { ...item, mode: 'input', input: 0 }), 620); return () => window.clearTimeout(timer); }, [game.display, game.mode, game.sequence.length, paused]);
  const choose = (cell: number) => { if (paused || saving || game.mode !== 'input') return; if (cell !== game.sequence[game.input]) { setGame(item => ({ ...item, mode: 'watch', display: 0, input: 0, retried: true })); return; } const input = game.input + 1; if (input < game.sequence.length) { setGame(item => ({ ...item, input })); return; } if (game.round >= MAX_VISUAL_ROUND) { onComplete({ score: game.round * 11, duration: game.elapsed, summary: lang === 'es' ? `Racha de ${game.round} rondas.` : `${game.round}-round streak.` }); return; } const round = game.round + 1; setGame(item => ({ ...item, round, sequence: makeSequence(`${seed}-visual-${round}`, VISUAL_MEMORY_INITIAL_LENGTH + round - 1, 9), display: 0, mode: 'watch', input: 0, retried: false })); };
  const active = game.mode === 'watch' ? game.sequence[game.display] : null;
  return <div className="space-y-6"><div className="flex flex-wrap gap-3"><Pill>{lang === 'es' ? 'Ronda' : 'Round'} {game.round}/{MAX_VISUAL_ROUND}</Pill><Pill>{lang === 'es' ? 'Mejor racha' : 'Best streak'} {bestVisualStreak}</Pill><Pill>{game.mode === 'watch' ? (lang === 'es' ? 'Observa con calma' : 'Watch calmly') : wait(lang)}</Pill>{game.retried && <Pill>{lang === 'es' ? 'Secuencia revisada' : 'Sequence reviewed'}</Pill>}</div><div className="grid grid-cols-3 gap-3 max-w-md mx-auto">{Array.from({ length: 9 }, (_, index) => <button key={index} disabled={paused || game.mode !== 'input'} onClick={() => choose(index)} className={`aspect-square rounded-xl border transition-all duration-500 ${active === index ? 'bg-primary border-primary scale-95 shadow-lg shadow-primary/40' : 'bg-white/5 border-[#324d67] hover:border-primary hover:bg-primary/10'}`} />)}</div></div>;
};

const NumberSequence: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang, seed }) => {
  type State = { round: number; sequence: number[]; input: number[]; mode: 'show' | 'input'; elapsed: number };
  const [game, setGame] = useState<State>(() => { const raw = state as Partial<State>; const round = raw.round || 1; return { round, sequence: raw.sequence || makeSequence(`${seed}-numbers-${round}`, NUMBER_SEQUENCE_INITIAL_LENGTH + round - 1, 10), input: raw.input || [], mode: raw.mode || 'show', elapsed: raw.elapsed || 0 }; }); useSnapshot(game, onSnapshot);
  useSecondTick(paused, useCallback(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1 })), []));
  useEffect(() => { if (paused || game.mode !== 'show') return; const timer = window.setTimeout(() => setGame(item => ({ ...item, mode: 'input' })), 1500); return () => window.clearTimeout(timer); }, [game.mode, paused]);
  const pick = (number: number) => { if (paused || saving || game.mode !== 'input') return; const input = [...game.input, number]; if (number !== game.sequence[input.length - 1]) { setGame(item => ({ ...item, input: [], mode: 'show' })); return; } if (input.length < game.sequence.length) { setGame(item => ({ ...item, input })); return; } if (game.round >= MAX_NUMBER_ROUND) { onComplete({ score: game.round * 15, duration: game.elapsed, summary: lang === 'es' ? `Completaste ${game.round} rondas de memoria de trabajo.` : `You completed ${game.round} working-memory rounds.` }); return; } const round = game.round + 1; setGame(item => ({ ...item, round, sequence: makeSequence(`${seed}-numbers-${round}`, NUMBER_SEQUENCE_INITIAL_LENGTH + round - 1, 10), input: [], mode: 'show' })); };
  return <div className="space-y-6 text-center"><div className="flex justify-center gap-3"><Pill>{lang === 'es' ? 'Ronda' : 'Round'} {game.round}/{MAX_NUMBER_ROUND}</Pill><Pill>{game.mode === 'show' ? (lang === 'es' ? 'Memoriza' : 'Memorize') : wait(lang)}</Pill></div><div className="min-h-20 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-3xl font-black tracking-[.28em] text-content">{game.mode === 'show' ? game.sequence.join(' ') : game.input.join(' ') || '· · ·'}</div><div className="grid grid-cols-5 gap-2 max-w-md mx-auto">{Array.from({ length: 10 }, (_, index) => <button key={index} disabled={paused || game.mode !== 'input'} onClick={() => pick(index)} className="h-14 rounded-xl bg-white/5 border border-[#324d67] text-content font-bold hover:border-primary hover:bg-primary/10">{index}</button>)}</div><p className="text-xs text-[#92adc9]">{lang === 'es' ? 'Si fallas, podrás intentarlo de nuevo sin presión.' : 'If you miss, you can calmly try the same round again.'}</p></div>;
};

const ChangeDetection: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang, seed }) => {
  type State = { round: number; base: number[]; differences: number[]; found: number[]; elapsed: number };
  const initial = (): State => { const raw = state as Partial<State>; const round = raw.round || 1; const data = createChange(`${seed}-change-${round}`, round); return { round, base: raw.base || data.base, differences: raw.differences || data.differences, found: raw.found || [], elapsed: raw.elapsed || 0 }; };
  const [game, setGame] = useState<State>(initial); useSnapshot(game, onSnapshot); useSecondTick(paused, useCallback(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1 })), []));
  const select = (index: number) => { if (paused || saving || !game.differences.includes(index) || game.found.includes(index)) return; const found = [...game.found, index]; if (found.length < game.differences.length) { setGame(item => ({ ...item, found })); return; } if (game.round >= 5) { onComplete({ score: Math.min(100, 55 + game.round * 9), duration: game.elapsed, summary: lang === 'es' ? 'Encontraste todas las diferencias con atención sostenida.' : 'You found every difference with sustained attention.' }); return; } const round = game.round + 1; const data = createChange(`${seed}-change-${round}`, round); setGame(item => ({ ...item, round, ...data, found: [] })); };
  const Tile = ({ index, right }: { index: number; right?: boolean }) => { const changed = right && game.differences.includes(index); const found = game.found.includes(index); return <button onClick={() => right && select(index)} disabled={!right || paused || saving} className={`aspect-square rounded-md border transition-colors ${found ? 'bg-accent-teal/30 border-accent-teal' : 'bg-white/5 border-[#324d67]'}`}><span className={`block mx-auto size-3 rounded-sm ${changed ? 'bg-primary rotate-45' : game.base[index] ? 'bg-accent-cyan' : 'bg-primary/50'}`} /></button>; };
  return <div className="space-y-5"><div className="flex flex-wrap gap-3"><Pill>{lang === 'es' ? 'Ronda' : 'Round'} {game.round}/5</Pill><Pill>{game.found.length}/{game.differences.length} {lang === 'es' ? 'diferencias' : 'differences'}</Pill><Pill>{game.elapsed}s</Pill></div><p className="text-sm text-[#92adc9]">{lang === 'es' ? 'Toca los cambios en el patrón derecho. El cronómetro acompaña, no presiona.' : 'Tap changes on the right pattern. The timer accompanies; it does not pressure.'}</p><div className="grid md:grid-cols-2 gap-5 max-w-2xl"><div className="grid grid-cols-4 gap-2 rounded-xl bg-white/[.03] p-3">{game.base.map((_, index) => <Tile key={index} index={index} />)}</div><div className="grid grid-cols-4 gap-2 rounded-xl bg-white/[.03] p-3">{game.base.map((_, index) => <Tile key={index} index={index} right />)}</div></div></div>;
};

const CalmReflex: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang }) => {
  type State = { round: number; position: number; direction: number; hits: number; elapsed: number; note: string };
  const [game, setGame] = useState<State>(() => ({ round: (state.round as number) || 1, position: (state.position as number) ?? 0, direction: (state.direction as number) || 1, hits: (state.hits as number) || 0, elapsed: (state.elapsed as number) || 0, note: (state.note as string) || '' })); useSnapshot(game, onSnapshot);
  useEffect(() => { if (paused) return; const timer = window.setInterval(() => setGame(item => { const next = item.position + item.direction * .025; return next >= 1 || next <= 0 ? { ...item, position: Math.max(0, Math.min(1, next)), direction: -item.direction } : { ...item, position: next }; }), 60); return () => window.clearInterval(timer); }, [paused]);
  useSecondTick(paused, useCallback(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1 })), []));
  const tap = () => { if (paused || saving) return; const target = .72; const margin = Math.max(REFLEX_MIN_MARGIN, REFLEX_START_MARGIN - game.round * .02); const success = Math.abs(game.position - target) <= margin; if (!success) { setGame(item => ({ ...item, note: lang === 'es' ? 'Casi: espera el tono objetivo.' : 'Almost: wait for the target tone.' })); return; } if (game.round >= 6) { onComplete({ score: Math.min(100, 55 + game.hits * 8), duration: game.elapsed, summary: lang === 'es' ? 'Completaste una práctica de timing serena.' : 'You completed a calm timing practice.' }); return; } setGame(item => ({ ...item, round: item.round + 1, hits: item.hits + 1, note: lang === 'es' ? 'Bien sincronizado.' : 'Well timed.' })); };
  const hue = 195 + game.position * 80;
  return <div className="flex flex-col items-center gap-6"><div className="flex gap-3"><Pill>{lang === 'es' ? 'Ronda' : 'Round'} {game.round}/6</Pill><Pill>{lang === 'es' ? 'Margen suave' : 'Gentle margin'}</Pill></div><div className="relative size-64 flex items-center justify-center"><div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20"/><div className="size-44 rounded-full transition-colors duration-100" style={{ backgroundColor: `hsl(${hue} 70% 54% / .72)`, boxShadow: `0 0 55px hsl(${hue} 80% 55% / .25)` }}/><div className="absolute size-5 rounded-full border-2 border-white/80" style={{ transform: 'rotate(259deg) translateY(-118px)' }}/></div><button onClick={tap} disabled={paused || saving} className="h-12 px-6 rounded-xl bg-primary text-content font-bold">{lang === 'es' ? 'Tocar al llegar al tono' : 'Tap at target tone'}</button><p className="text-sm text-[#92adc9]">{game.note || (lang === 'es' ? 'El círculo se mueve lentamente; no hay cuenta atrás.' : 'The circle moves slowly; there is no countdown.')}</p></div>;
};

const MirrorBreathing: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang }) => {
  const phases = [{ label: lang === 'es' ? 'Inhalar' : 'Inhale', seconds: 4, scale: 1.2 }, { label: lang === 'es' ? 'Sostener' : 'Hold', seconds: 7, scale: 1.2 }, { label: lang === 'es' ? 'Exhalar' : 'Exhale', seconds: 8, scale: .72 }];
  type State = { phase: number; phaseSecond: number; streak: number; cycles: number; awaiting: boolean; elapsed: number };
  const [game, setGame] = useState<State>(() => ({ phase: (state.phase as number) || 0, phaseSecond: (state.phaseSecond as number) || 0, streak: (state.streak as number) || 0, cycles: (state.cycles as number) || 0, awaiting: !!state.awaiting, elapsed: (state.elapsed as number) || 0 })); useSnapshot(game, onSnapshot);
  useEffect(() => { if (paused) return; const timer = window.setInterval(() => setGame(item => { const phase = phases[item.phase]; if (item.phaseSecond + 1 < phase.seconds) return { ...item, phaseSecond: item.phaseSecond + 1, elapsed: item.elapsed + 1 }; const next = (item.phase + 1) % phases.length; const cycles = next === 0 ? item.cycles + 1 : item.cycles; return { ...item, phase: next, phaseSecond: 0, cycles, awaiting: true, elapsed: item.elapsed + 1 }; }), 1000); return () => window.clearInterval(timer); }, [paused, phases.length]);
  const sync = () => { if (paused || saving || !game.awaiting) return; if (game.cycles >= 3) { onComplete({ score: Math.min(100, 70 + (game.streak + 1) * 10), duration: game.elapsed, summary: lang === 'es' ? 'Sincronizaste tu respiración con tres ciclos 4-7-8.' : 'You synchronized your breathing through three 4-7-8 cycles.' }); return; } setGame(item => ({ ...item, awaiting: false, streak: item.streak + 1 })); };
  const phase = phases[game.phase];
  return <div className="flex flex-col items-center gap-6"><div className="flex gap-3"><Pill>4-7-8</Pill><Pill>{lang === 'es' ? 'Racha' : 'Streak'} {game.streak}</Pill><Pill>{lang === 'es' ? 'Ciclo' : 'Cycle'} {game.cycles + 1}/3</Pill></div><div className="size-72 flex items-center justify-center"><div className="size-44 rounded-full bg-primary/30 border border-primary/70 flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform ease-in-out" style={{ transform: `scale(${phase.scale})`, transitionDuration: `${phase.seconds * 1000}ms` }}><span className="text-content text-xl font-black">{phase.label}</span></div></div><button onClick={sync} disabled={paused || saving || !game.awaiting} className="h-12 px-6 rounded-xl bg-accent-teal text-content font-bold disabled:opacity-50">{game.awaiting ? (lang === 'es' ? 'Sincronizar transición' : 'Sync transition') : (lang === 'es' ? 'Respira con calma' : 'Breathe calmly')}</button><p className="text-sm text-[#92adc9]">{lang === 'es' ? 'Un toque suave al cambiar de fase mantiene la racha.' : 'A gentle tap at each phase change keeps your streak.'}</p></div>;
};

const PatternMatch: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang, seed }) => {
  type State = { round: number; odd: number; hits: number; misses: number; elapsed: number };
  const [game, setGame] = useState<State>(() => ({ round: (state.round as number) || 1, odd: (state.odd as number) ?? Math.floor(seeded(`${seed}-pattern-1`)() * 36), hits: (state.hits as number) || 0, misses: (state.misses as number) || 0, elapsed: (state.elapsed as number) || 0 })); useSnapshot(game, onSnapshot); useSecondTick(paused, useCallback(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1 })), []));
  const choose = (index: number) => { if (paused || saving) return; if (index !== game.odd) { setGame(item => ({ ...item, misses: item.misses + 1 })); return; } if (game.round >= 6) { onComplete({ score: Math.max(0, 70 + game.hits * 5 - game.misses * 4), duration: game.elapsed, summary: lang === 'es' ? 'Completaste una búsqueda visual tranquila.' : 'You completed a calm visual search.' }); return; } const round = game.round + 1; setGame(item => ({ ...item, round, hits: item.hits + 1, odd: Math.floor(seeded(`${seed}-pattern-${round}`)() * 36) })); };
  return <div className="space-y-5"><div className="flex gap-3"><Pill>{lang === 'es' ? 'Ronda' : 'Round'} {game.round}/6</Pill><Pill>{lang === 'es' ? 'Aciertos' : 'Hits'} {game.hits}</Pill></div><p className="text-sm text-[#92adc9]">{lang === 'es' ? 'Encuentra la figura suavemente diferente.' : 'Find the gently different shape.'}</p><div className="grid grid-cols-6 gap-2 max-w-xl">{Array.from({ length: 36 }, (_, index) => <button key={index} onClick={() => choose(index)} disabled={paused || saving} className="aspect-square rounded-lg bg-white/5 border border-[#263d52] text-primary hover:bg-primary/10"><span className="material-symbols-outlined" style={{ transform: index === game.odd ? 'rotate(45deg)' : undefined }}>change_history</span></button>)}</div></div>;
};

const FocusBreathing: React.FC<RunnerProps> = ({ state, paused, saving, onSnapshot, onComplete, lang }) => {
  const labels = [lang === 'es' ? 'Inhala' : 'Breathe in', lang === 'es' ? 'Sostén' : 'Hold', lang === 'es' ? 'Exhala' : 'Breathe out'];
  type State = { phase: number; phaseSecond: number; elapsed: number };
  const [game, setGame] = useState<State>(() => ({ phase: (state.phase as number) || 0, phaseSecond: (state.phaseSecond as number) || 0, elapsed: (state.elapsed as number) || 0 })); useSnapshot(game, onSnapshot);
  useEffect(() => { if (paused) return; const timer = window.setInterval(() => setGame(item => ({ ...item, elapsed: item.elapsed + 1, phaseSecond: item.phaseSecond + 1 >= 4 ? 0 : item.phaseSecond + 1, phase: item.phaseSecond + 1 >= 4 ? (item.phase + 1) % 3 : item.phase })), 1000); return () => window.clearInterval(timer); }, [paused]);
  const phase = game.phase === 0 ? 1.18 : game.phase === 2 ? .72 : 1.18;
  return <div className="flex flex-col items-center gap-6"><div className="size-72 flex items-center justify-center"><div className="size-44 rounded-full bg-primary/30 border border-primary/70 flex items-center justify-center shadow-2xl shadow-primary/20 transition-transform duration-[3800ms] ease-in-out" style={{ transform: `scale(${phase})` }}><span className="text-content text-xl font-black">{labels[game.phase]}</span></div></div><button disabled={paused || saving} onClick={() => onComplete({ score: 100, duration: game.elapsed, summary: lang === 'es' ? 'Completaste una pausa de respiración consciente.' : 'You completed a mindful breathing pause.' })} className="h-11 px-5 rounded-xl bg-accent-teal text-content text-sm font-bold">{lang === 'es' ? 'Finalizar cuando estés listo' : 'Finish when you are ready'}</button></div>;
};

const makeSequence = (seed: string, length: number, options: number) => { const random = seeded(seed); return Array.from({ length }, () => Math.floor(random() * options)); };
const createChange = (seed: string, round: number) => { const random = seeded(seed); const base = Array.from({ length: 16 }, () => random() > .5 ? 1 : 0); const count = Math.min(CHANGE_DETECTION_MAX_DIFFERENCES, 2 + round); const pool = Array.from({ length: 16 }, (_, i) => i).sort(() => random() - .5); return { base, differences: pool.slice(0, count) }; };

export default MindGames;
