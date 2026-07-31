/**
 * gameStateStorage.ts
 * ─────────────────────────────────────────────────────────────
 * Capa de persistencia agnóstica de plataforma para NeuroBreak.
 *
 * REGLA DE ORO: El resto de la app NUNCA llama a localStorage directamente.
 * Todo pasa por guardarEstado / leerEstado / limpiarEstado.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Reemplazar la clase `BrowserStorageAdapter` por una nueva que use
 *   `window.__TAURI__.fs` o el módulo `fs` de Node/Electron IPC.
 *   La interfaz `StorageAdapter` + las tres funciones públicas NO cambian.
 *   Los juegos y hooks jamás necesitan modificarse.
 */

// ─────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────

/** Estado genérico de un juego en curso. */
export interface GameSnapshot {
  /** Versión del esquema; incrementar si se cambia la forma del dato. */
  version: 2;
  /** Identificador del juego (ej. "memory-visual-1"). */
  gameId: string;
  /** Ronda actual del juego. */
  round: number;
  /** Puntuación parcial acumulada. */
  score: number;
  /** Estado específico del juego (secuencia mostrada, fase actual, etc.). */
  gameState: Record<string, unknown>;
  /** Unix-ms del primer inicio de esta partida. */
  startedAt: number;
  /** Unix-ms del último guardado (usado para la expiración). */
  savedAt: number;
  /** ¿Está la partida pausada? */
  paused: boolean;
  /** Semilla de aleatoriedad reproducible para este intento. */
  seed: string;
  /** ID del usuario propietario de la sesión. */
  userId: string;
}

/** Tiempo en ms tras el cual una sesión guardada se considera expirada. */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ─────────────────────────────────────────────────────────────
// Interfaz del adaptador de almacenamiento
// ─────────────────────────────────────────────────────────────

/**
 * Contrato que debe cumplir cualquier backend de almacenamiento.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Implementar esta interfaz usando `tauri-plugin-fs` o `fs` de Node
 *   y pasar la instancia a `configureStorage()`.
 *
 * @example Esqueleto para Tauri:
 * class TauriStorageAdapter implements StorageAdapter {
 *   getItem(key: string) { return tauriStore.get(key); }
 *   setItem(key: string, value: string) { tauriStore.set(key, value); }
 *   removeItem(key: string) { tauriStore.delete(key); }
 * }
 */
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// ─────────────────────────────────────────────────────────────
// Implementación web (localStorage)
// ─────────────────────────────────────────────────────────────

/**
 * Adaptador web que usa localStorage.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Crear `TauriStorageAdapter` o `ElectronStorageAdapter` e inyectarlo
 *   con `configureStorage(new TauriStorageAdapter())`.
 */
class BrowserStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // El almacenamiento es opcional — si falla (modo privado, cuota llena), no rompemos el juego.
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silenciar errores de almacenamiento no críticos.
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton del adaptador activo
// ─────────────────────────────────────────────────────────────

let _adapter: StorageAdapter = new BrowserStorageAdapter();

/**
 * Sustituye el adaptador de almacenamiento en tiempo de ejecución.
 * Llamar UNA vez al arrancar la app (ej. en main.ts para Electron/Tauri).
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 * @example
 * // En src/main.ts, antes de renderizar React:
 * import { configureStorage } from './services/gameStateStorage';
 * import { TauriStorageAdapter } from './adapters/tauriStorage';
 * configureStorage(new TauriStorageAdapter());
 */
export function configureStorage(adapter: StorageAdapter): void {
  _adapter = adapter;
}

// ─────────────────────────────────────────────────────────────
// Clave de almacenamiento
// ─────────────────────────────────────────────────────────────

/** Clave namespaceada para evitar colisiones con otras apps en el mismo origen. */
const storageKey = (userId: string, gameId: string): string =>
  `neurobreak.game-state.v2.${userId}.${gameId}`;

// ─────────────────────────────────────────────────────────────
// API pública — las ÚNICAS funciones que el resto del código usa
// ─────────────────────────────────────────────────────────────

/**
 * Guarda (o actualiza) el estado de un juego en curso.
 * Agregar campos aquí no requiere cambios en los componentes de juego.
 *
 * @param userId  - ID del usuario actual
 * @param gameId  - ID del juego (ej. "memory-visual-1")
 * @param datos   - Payload del snapshot sin campos derivados (version, savedAt, userId, gameId)
 */
export function guardarEstado(
  userId: string,
  gameId: string,
  datos: Omit<GameSnapshot, 'version' | 'savedAt' | 'userId' | 'gameId'>
): void {
  const snapshot: GameSnapshot = {
    version: 2,
    userId,
    gameId,
    savedAt: Date.now(),
    ...datos,
  };
  _adapter.setItem(storageKey(userId, gameId), JSON.stringify(snapshot));
}

/**
 * Lee el estado guardado de un juego.
 * Devuelve `null` si:
 *   - No existe estado guardado.
 *   - El dato está corrupto o es de una versión incompatible.
 *   - La sesión expiró (superó SESSION_TTL_MS desde el último guardado).
 *
 * @param userId - ID del usuario actual
 * @param gameId - ID del juego (ej. "memory-visual-1")
 */
export function leerEstado(userId: string, gameId: string): GameSnapshot | null {
  const raw = _adapter.getItem(storageKey(userId, gameId));
  if (!raw) return null;

  let snapshot: GameSnapshot;
  try {
    snapshot = JSON.parse(raw) as GameSnapshot;
  } catch {
    // JSON inválido — limpiar y arrancar desde cero.
    limpiarEstado(userId, gameId);
    return null;
  }

  // Validar integridad y compatibilidad del dato.
  if (
    snapshot.version !== 2 ||
    snapshot.userId !== userId ||
    snapshot.gameId !== gameId
  ) {
    limpiarEstado(userId, gameId);
    return null;
  }

  // Verificar expiración (24 h por defecto).
  if (Date.now() - snapshot.savedAt > SESSION_TTL_MS) {
    limpiarEstado(userId, gameId);
    return null;
  }

  return snapshot;
}

/**
 * Elimina el estado guardado de un juego.
 * Llamar SIEMPRE al terminar o abandonar explícitamente una partida,
 * para no restaurar una sesión ya finalizada.
 *
 * @param userId - ID del usuario actual
 * @param gameId - ID del juego (ej. "memory-visual-1")
 */
export function limpiarEstado(userId: string, gameId: string): void {
  _adapter.removeItem(storageKey(userId, gameId));
}
