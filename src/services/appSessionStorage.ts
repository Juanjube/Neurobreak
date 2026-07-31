/**
 * appSessionStorage.ts
 * ─────────────────────────────────────────────────────────────
 * Capa de persistencia de sesión global de navegación para NeuroBreak.
 *
 * REGLA DE ORO: El resto de la app NUNCA llama a localStorage directamente para
 * la sesión de navegación. Todo pasa por guardarSesion / leerSesion / limpiarSesion.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Reemplazar la clase `BrowserAppSessionStorageAdapter` por una nueva que use
 *   `window.__TAURI__.fs` o IPC de Electron (`ipcRenderer`).
 *   La interfaz `StorageAdapter` + las tres funciones públicas NO cambian.
 *   Los componentes y hooks de la app jamás necesitan modificarse.
 */

import { Page } from '../types';

// ─────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────

/** Snapshot global de la sesión de navegación de la app. */
export interface AppSessionSnapshot {
  /** Versión del esquema; incrementar si cambia la estructura del dato. */
  version: 2;
  /** ID del usuario propietario de la sesión. */
  userId: string;
  /** Sección o página activa actual. */
  currentPage: Page;
  /** Mapa de posiciones de scroll por sección ({ [Page.MIND_GAMES]: 420 }). */
  scrollPositions: Record<string, number>;
  /** Mapa de filtros o pestañas activas por sección. */
  activeFilters: Record<string, Record<string, any>>;
  /** ID del juego en curso (si aplica, referencia a gameStateStorage). */
  activeGameId?: string | null;
  /** ID del movimiento activo (si aplica, para la sección RITUAL). */
  activeMovementId?: string | null;
  /** Unix-ms del último guardado (usado para la expiración). */
  savedAt: number;
}

/** Tiempo en ms tras el cual la sesión guardada se considera expirada (48 horas). */
export const APP_SESSION_TTL_MS = 48 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// Interfaz del adaptador de almacenamiento
// ─────────────────────────────────────────────────────────────

/**
 * Contrato que debe cumplir cualquier backend de almacenamiento para la sesión global.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 * @example
 * class TauriAppStorageAdapter implements StorageAdapter {
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

class BrowserAppSessionStorageAdapter implements StorageAdapter {
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
      // El almacenamiento es opcional; si falla en modo incógnito/cuota, la app no se interrumpe.
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Silenciar errores no críticos.
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton del adaptador activo
// ─────────────────────────────────────────────────────────────

let _appAdapter: StorageAdapter = new BrowserAppSessionStorageAdapter();

/**
 * Sustituye el adaptador de almacenamiento de sesión global en tiempo de ejecución.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 * @example
 * import { configureAppStorage } from './services/appSessionStorage';
 * import { TauriAppStorageAdapter } from './adapters/tauriStorage';
 * configureAppStorage(new TauriAppStorageAdapter());
 */
export function configureAppStorage(adapter: StorageAdapter): void {
  _appAdapter = adapter;
}

// ─────────────────────────────────────────────────────────────
// Clave de almacenamiento
// ─────────────────────────────────────────────────────────────

const storageKey = (userId: string): string =>
  `neurobreak.app-session.v2.${userId}`;

// ─────────────────────────────────────────────────────────────
// API pública — Funciones agnósticas de plataforma
// ─────────────────────────────────────────────────────────────

/**
 * Guarda o actualiza el snapshot de sesión de navegación global del usuario.
 *
 * @param userId - ID del usuario autenticado
 * @param datos  - Payload de la sesión (sin versión, userId ni timestamp que se autogeneran)
 */
export function guardarSesion(
  userId: string,
  datos: Omit<AppSessionSnapshot, 'version' | 'savedAt' | 'userId'>
): void {
  if (!userId) return;

  const snapshot: AppSessionSnapshot = {
    version: 2,
    userId,
    savedAt: Date.now(),
    ...datos,
  };

  _appAdapter.setItem(storageKey(userId), JSON.stringify(snapshot));
}

/**
 * Lee la sesión guardada del usuario.
 * Devuelve `null` si:
 *   - No existe sesión previa.
 *   - El JSON está corrupto o tiene una versión incompatible.
 *   - La sesión ha expirado (más de 48h desde el último guardado).
 *
 * @param userId - ID del usuario autenticado
 */
export function leerSesion(userId: string): AppSessionSnapshot | null {
  if (!userId) return null;

  const raw = _appAdapter.getItem(storageKey(userId));
  if (!raw) return null;

  let snapshot: AppSessionSnapshot;
  try {
    snapshot = JSON.parse(raw) as AppSessionSnapshot;
  } catch {
    limpiarSesion(userId);
    return null;
  }

  // Validar versión e integridad del usuario
  if (snapshot.version !== 2 || snapshot.userId !== userId) {
    limpiarSesion(userId);
    return null;
  }

  // Verificar expiración (48h configurable)
  if (Date.now() - snapshot.savedAt > APP_SESSION_TTL_MS) {
    limpiarSesion(userId);
    return null;
  }

  return snapshot;
}

/**
 * Elimina la sesión guardada del usuario (por ejemplo al cerrar sesión).
 *
 * @param userId - ID del usuario autenticado
 */
export function limpiarSesion(userId: string): void {
  if (!userId) return;
  _appAdapter.removeItem(storageKey(userId));
}
