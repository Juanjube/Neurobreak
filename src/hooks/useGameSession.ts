/**
 * useGameSession.ts
 * ─────────────────────────────────────────────────────────────
 * Hook reutilizable de sesión de juego para NeuroBreak.
 *
 * Encapsula:
 *   ✓ Guardado automático en checkpoints (cada vez que cambia gameState)
 *   ✓ Detección de pérdida de foco (visibilitychange) → pausa automática
 *   ✓ Restauración al montar si existe sesión guardada
 *   ✓ Limpieza de sesión al finalizar / abandonar
 *
 * Uso por componente de juego:
 * ─────────────────────────────────────────────────────────────
 * const {
 *   gameState,       // estado del juego a mostrar en el componente
 *   setGameState,    // actualizar el estado (dispara guardado automático)
 *   paused,          // ¿está pausado?
 *   resumeGame,      // botón "Reanudar" llama esto
 *   finishGame,      // llamar al completar (limpia sesión)
 *   abandonGame,     // llamar al salir (limpia sesión)
 *   restoredSession, // true si se está volviendo a una sesión anterior
 *   snapshot,        // el snapshot completo (round, score, seed, startedAt)
 * } = useGameSession(userId, gameId, initialState);
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Este hook NO cambia. Solo reemplazar el adaptador en gameStateStorage.ts.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GameSnapshot,
  guardarEstado,
  leerEstado,
  limpiarEstado,
} from '../services/gameStateStorage';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ─────────────────────────────────────────────────────────────
// Tipos del hook
// ─────────────────────────────────────────────────────────────

export interface GameSessionState {
  /** Estado interno del juego (lo que antes era useState en cada componente). */
  gameState: Record<string, unknown>;
  /** Actualiza el estado del juego y persiste automáticamente. */
  setGameState: (
    updater:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => void;
  /** Ronda actual persistida. */
  round: number;
  /** Actualiza la ronda actual y persiste. */
  setRound: (r: number) => void;
  /** Puntaje parcial persistido. */
  score: number;
  /** Actualiza el puntaje y persiste. */
  setScore: (s: number) => void;
  /** Semilla reproducible para la sesión. */
  seed: string;
  /** Timestamp Unix-ms del primer inicio de la sesión. */
  startedAt: number;
  /** ¿Está el juego pausado? */
  paused: boolean;
  /** Reanuda el juego (llamar desde botón "Reanudar"). */
  resumeGame: () => void;
  /** Señala que el juego finalizó correctamente (limpia sesión). */
  finishGame: () => void;
  /** Señala que el usuario abandonó (limpia sesión). */
  abandonGame: () => void;
  /** true si al montar se encontró y restauró una sesión previa. */
  restoredSession: boolean;
  /** El snapshot completo tal como está almacenado. Útil para debugging. */
  snapshot: Omit<GameSnapshot, 'version'> | null;
}

// ─────────────────────────────────────────────────────────────
// El hook
// ─────────────────────────────────────────────────────────────

/**
 * Hook de sesión de juego con persistencia automática.
 *
 * @param userId       - ID del usuario actual (para namespacing en storage)
 * @param gameId       - ID del juego (ej. "memory-visual-1")
 * @param initialState - Estado inicial del juego si no hay sesión guardada
 */
export function useGameSession(
  userId: string,
  gameId: string,
  initialState: Record<string, unknown> = {}
): GameSessionState {
  // ── Estado interno del juego ───────────────────────────────
  const [gameState, _setGameState] = useState<Record<string, unknown>>(initialState);
  const [round, _setRound] = useState(1);
  const [score, _setScore] = useState(0);
  const [seed, setSeed] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [restoredSession, setRestoredSession] = useState(false);
  const [snapshot, setSnapshot] = useState<Omit<GameSnapshot, 'version'> | null>(null);

  // Ref para evitar guardar durante el primer render (antes de restaurar).
  const isInitializedRef = useRef(false);
  // Ref para saber si el juego terminó (evitar guardar estado de fin de juego).
  const isFinishedRef = useRef(false);

  // ── Función de guardado (checkpoint) ─────────────────────
  const persistCheckpoint = useCallback(
    (
      currentState: Record<string, unknown>,
      currentRound: number,
      currentScore: number,
      currentSeed: string,
      currentStartedAt: number,
      currentPaused: boolean
    ) => {
      if (!isInitializedRef.current || isFinishedRef.current) return;
      guardarEstado(userId, gameId, {
        gameState: currentState,
        round: currentRound,
        score: currentScore,
        seed: currentSeed,
        startedAt: currentStartedAt,
        paused: currentPaused,
      });
      setSnapshot({
        userId,
        gameId,
        gameState: currentState,
        round: currentRound,
        score: currentScore,
        seed: currentSeed,
        startedAt: currentStartedAt,
        paused: currentPaused,
        savedAt: Date.now(),
      });
    },
    [userId, gameId]
  );

  // ── Setters con checkpoint automático ────────────────────

  const setGameState = useCallback(
    (
      updater:
        | Record<string, unknown>
        | ((prev: Record<string, unknown>) => Record<string, unknown>)
    ) => {
      _setGameState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        // Leemos los valores actuales desde los refs para evitar stale closure.
        // El guardado se hace con los valores del closure — no es un problema
        // porque round/score se actualizan en sus propios setters.
        return next;
      });
    },
    []
  );

  const setRound = useCallback((r: number) => {
    _setRound(r);
  }, []);

  const setScore = useCallback((s: number) => {
    _setScore(s);
  }, []);

  // ── Guardado automático cuando cambia gameState, round o score ─
  // Usamos un efecto separado con los valores consolidados para
  // reducir escrituras redundantes.
  const persistRef = useRef(persistCheckpoint);
  persistRef.current = persistCheckpoint;

  useEffect(() => {
    if (!isInitializedRef.current || isFinishedRef.current || !seed) return;
    persistRef.current(gameState, round, score, seed, startedAt, paused);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, round, score, paused, seed, startedAt]);

  // ── Detección de pérdida de foco (visibilitychange) ──────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isInitializedRef.current && !isFinishedRef.current) {
        // Pausar inmediatamente + guardar snapshot final antes de desaparecer.
        setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // Intencionalmente sin dependencias: el listener necesita estar siempre activo.
    // 🔄 MIGRACIÓN ELECTRON/TAURI: Cambiar por el evento equivalente de la ventana nativa.
    //   En Tauri: listen('tauri://blur', handleVisibility)
    //   En Electron: ipcRenderer.on('window-blur', handleVisibility)
  }, []);

  // ── Restauración al montar ────────────────────────────────
  useEffect(() => {
    const saved = leerEstado(userId, gameId);

    if (saved) {
      // Restaurar exactamente el estado guardado.
      _setGameState(saved.gameState);
      _setRound(saved.round);
      _setScore(saved.score);
      setSeed(saved.seed);
      setStartedAt(saved.startedAt);
      // Siempre arrancar en pausa para que el usuario elija "Reanudar".
      setPaused(true);
      setRestoredSession(true);
      setSnapshot({ ...saved });
    } else {
      // Sesión nueva: generar semilla y timestamp.
      const newSeed = uid();
      const now = Date.now();
      setSeed(newSeed);
      setStartedAt(now);
      setPaused(false);
      setRestoredSession(false);
    }

    isInitializedRef.current = true;
  // Solo ejecutar al montar (userId y gameId no cambian durante una sesión).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Controles públicos ────────────────────────────────────

  const resumeGame = useCallback(() => {
    setPaused(false);
  }, []);

  const finishGame = useCallback(() => {
    isFinishedRef.current = true;
    limpiarEstado(userId, gameId);
    setSnapshot(null);
  }, [userId, gameId]);

  const abandonGame = useCallback(() => {
    isFinishedRef.current = true;
    limpiarEstado(userId, gameId);
    setSnapshot(null);
  }, [userId, gameId]);

  return {
    gameState,
    setGameState,
    round,
    setRound,
    score,
    setScore,
    seed,
    startedAt,
    paused,
    resumeGame,
    finishGame,
    abandonGame,
    restoredSession,
    snapshot,
  };
}
