export interface ActiveGameSnapshot {
  version: 1;
  userId: string;
  gameId: string;
  seed: string;
  startedAt: number;
  gameState: Record<string, unknown>;
  paused: boolean;
  savedAt: number;
}

/** Platform boundary: Electron/Tauri can replace this adapter without touching game logic. */
export interface GameSessionStorage {
  load(userId: string): ActiveGameSnapshot | null;
  save(snapshot: ActiveGameSnapshot): void;
  clear(userId: string): void;
}

const storageKey = (userId: string) => `neurobreak.active-mind-game.${userId}`;

export class BrowserGameSessionStorage implements GameSessionStorage {
  load(userId: string) {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(storageKey(userId));
      if (!raw) return null;
      const snapshot = JSON.parse(raw) as ActiveGameSnapshot;
      return snapshot.version === 1 && snapshot.userId === userId ? snapshot : null;
    } catch {
      return null;
    }
  }

  save(snapshot: ActiveGameSnapshot) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(storageKey(snapshot.userId), JSON.stringify(snapshot)); } catch { /* storage is optional */ }
  }

  clear(userId: string) {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(storageKey(userId)); } catch { /* storage is optional */ }
  }
}

export const gameSessionStorage: GameSessionStorage = new BrowserGameSessionStorage();
