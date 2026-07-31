/**
 * useAppSession.ts
 * ─────────────────────────────────────────────────────────────
 * Hook de gestión y persistencia de sesión global para NeuroBreak.
 *
 * Se monta a nivel de la raíz de la app (App.tsx) y encapsula:
 *   ✓ Restauración automática y silenciosa de la sección activa, scroll y filtros.
 *   ✓ Guardado incremental al navegar entre páginas o cambiar filtros.
 *   ✓ Captura inmediata en `visibilitychange` al perder el foco/minimizar la pestaña.
 *   ✓ Scroll debounced para no saturar el almacenamiento.
 *   ✓ Expiración automática a las 48 horas.
 *
 * 🔄 MIGRACIÓN ELECTRON/TAURI:
 *   Para Electron/Tauri, reemplazar los eventos de ventana nativos en el listener
 *   de visibilidad (`blur` de la ventana nativa). El resto del hook NO cambia.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Page, User } from '../types';
import {
  guardarSesion,
  leerSesion,
  limpiarSesion,
} from '../services/appSessionStorage';

export interface UseAppSessionReturn {
  /** Página/Sección activa actual. */
  currentPage: Page;
  /** Cambia de página y restaura/guarda la posición de scroll automáticamente. */
  setCurrentPage: (page: Page) => void;
  /** Establece un filtro para una sección específica. */
  setPageFilter: (section: string, filterKey: string, value: any) => void;
  /** Obtiene un filtro guardado para una sección específica. */
  getPageFilter: <T>(section: string, filterKey: string, defaultValue: T) => T;
  /** ID del juego activo guardado en sesión (si aplica). */
  activeGameId: string | null;
  /** Establece o limpia el ID del juego activo. */
  setActiveGameId: (gameId: string | null) => void;
  /** ID del movimiento activo guardado (sección Ritual). */
  activeMovementId: string | null;
  /** Establece el movimiento activo. */
  setActiveMovementId: (movementId: string | null) => void;
  /** Indica si el estado actual fue restaurado de una sesión previa. */
  isRestored: boolean;
  /** Limpia la sesión global. */
  resetSession: () => void;
  /** Ref para el contenedor principal desplazable (`<main>`). */
  mainContainerRef: React.RefObject<HTMLElement>;
}

export function useAppSession(
  user: User | null,
  defaultPage: Page = Page.DASHBOARD
): UseAppSessionReturn {
  const isInitializedRef = useRef(false);
  const isRestoringRef = useRef(false);

  // Intentar leer la sesión síncronamente al inicializar si existe el usuario
  const savedSessionOnMount = user ? leerSesion(user.id) : null;

  const [currentPage, setCurrentPageState] = useState<Page>(
    () => savedSessionOnMount?.currentPage || defaultPage
  );
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>(
    () => savedSessionOnMount?.scrollPositions || {}
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, Record<string, any>>>(
    () => savedSessionOnMount?.activeFilters || {}
  );
  const [activeGameId, setActiveGameIdState] = useState<string | null>(
    () => savedSessionOnMount?.activeGameId || null
  );
  const [activeMovementId, setActiveMovementIdState] = useState<string | null>(
    () => savedSessionOnMount?.activeMovementId || null
  );
  const [isRestored, setIsRestored] = useState<boolean>(
    () => !!savedSessionOnMount
  );

  const mainContainerRef = useRef<HTMLElement>(null);

  // Ref que mantiene el estado más reciente para evitar cierres obsoletos en listeners
  const sessionStateRef = useRef({
    currentPage,
    scrollPositions,
    activeFilters,
    activeGameId,
    activeMovementId,
  });

  useEffect(() => {
    sessionStateRef.current = {
      currentPage,
      scrollPositions,
      activeFilters,
      activeGameId,
      activeMovementId,
    };
  }, [currentPage, scrollPositions, activeFilters, activeGameId, activeMovementId]);

  // ── Función helper para persistir la sesión actual ─────────
  const saveSession = useCallback(() => {
    if (!user || !isInitializedRef.current || isRestoringRef.current) return;
    const current = sessionStateRef.current;
    guardarSesion(user.id, {
      currentPage: current.currentPage,
      scrollPositions: current.scrollPositions,
      activeFilters: current.activeFilters,
      activeGameId: current.activeGameId,
      activeMovementId: current.activeMovementId,
    });
  }, [user]);

  // ── Restauración inicial / Sincronización cuando cambia el usuario ──────
  useEffect(() => {
    if (!user) {
      isInitializedRef.current = false;
      setIsRestored(false);
      return;
    }

    const saved = leerSesion(user.id);
    if (saved) {
      isRestoringRef.current = true;

      setCurrentPageState(saved.currentPage || defaultPage);
      setScrollPositions(saved.scrollPositions || {});
      setActiveFilters(saved.activeFilters || {});
      setActiveGameIdState(saved.activeGameId || null);
      setActiveMovementIdState(saved.activeMovementId || null);
      setIsRestored(true);

      sessionStateRef.current = {
        currentPage: saved.currentPage || defaultPage,
        scrollPositions: saved.scrollPositions || {},
        activeFilters: saved.activeFilters || {},
        activeGameId: saved.activeGameId || null,
        activeMovementId: saved.activeMovementId || null,
      };

      // Restaurar scroll de la página inicial con retardo para permitir el render del DOM
      setTimeout(() => {
        if (mainContainerRef.current && saved.scrollPositions?.[saved.currentPage]) {
          mainContainerRef.current.scrollTop = saved.scrollPositions[saved.currentPage];
        }
        isRestoringRef.current = false;
      }, 100);
    } else {
      setCurrentPageState(defaultPage);
      setIsRestored(false);
    }

    isInitializedRef.current = true;
  }, [user?.id, defaultPage]);

  // ── Navegación entre páginas con gestión de scroll ───────────
  const setCurrentPage = useCallback((newPage: Page) => {
    // 1. Guardar scroll de la página actual antes de cambiar
    if (mainContainerRef.current) {
      const currentScroll = mainContainerRef.current.scrollTop;
      setScrollPositions(prev => ({
        ...prev,
        [sessionStateRef.current.currentPage]: currentScroll,
      }));
    }

    // 2. Cambiar de página y actualizar la ref síncronamente
    setCurrentPageState(newPage);
    sessionStateRef.current.currentPage = newPage;

    // 3. Restaurar scroll de la nueva página una vez renderizada
    setTimeout(() => {
      if (mainContainerRef.current) {
        const targetScroll = sessionStateRef.current.scrollPositions[newPage] || 0;
        mainContainerRef.current.scrollTop = targetScroll;
      }
    }, 50);
  }, []);

  // ── Gestión de filtros por sección ────────────────────────────
  const setPageFilter = useCallback((section: string, filterKey: string, value: any) => {
    setActiveFilters(prev => {
      const sectionFilters = prev[section] || {};
      const updated = {
        ...prev,
        [section]: {
          ...sectionFilters,
          [filterKey]: value,
        },
      };
      sessionStateRef.current.activeFilters = updated;
      return updated;
    });
  }, []);

  const getPageFilter = useCallback(<T,>(section: string, filterKey: string, defaultValue: T): T => {
    const sectionFilters = activeFilters[section];
    if (sectionFilters && filterKey in sectionFilters) {
      return sectionFilters[filterKey] as T;
    }
    return defaultValue;
  }, [activeFilters]);

  // ── Controladores de Game / Movement ID ────────────────────────
  const setActiveGameId = useCallback((gameId: string | null) => {
    setActiveGameIdState(gameId);
    sessionStateRef.current.activeGameId = gameId;
  }, []);

  const setActiveMovementId = useCallback((movementId: string | null) => {
    setActiveMovementIdState(movementId);
    sessionStateRef.current.activeMovementId = movementId;
  }, []);

  // ── Evento de Scroll con Debounce para actualizar estado ───────
  useEffect(() => {
    const container = mainContainerRef.current;
    if (!container) return;

    let timeoutId: number | null = null;

    const handleScroll = () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        if (container) {
          const currentY = container.scrollTop;
          const page = sessionStateRef.current.currentPage;
          setScrollPositions(prev => {
            if (prev[page] === currentY) return prev;
            const updated = { ...prev, [page]: currentY };
            sessionStateRef.current.scrollPositions = updated;
            return updated;
          });
        }
      }, 150); // Debounce de 150ms
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [currentPage]);

  // ── Guardado automático al cambiar cualquier parte relevante del estado ──
  useEffect(() => {
    if (isInitializedRef.current && user && !isRestoringRef.current) {
      saveSession();
    }
  }, [currentPage, scrollPositions, activeFilters, activeGameId, activeMovementId, user, saveSession]);

  // ── Listener de `visibilitychange` (Pérdida/Recuperación de foco) ─
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Al ocultar pestaña/ventana: guardar snapshot inmediato
        if (mainContainerRef.current) {
          const currentScroll = mainContainerRef.current.scrollTop;
          const page = sessionStateRef.current.currentPage;
          sessionStateRef.current.scrollPositions[page] = currentScroll;
        }
        saveSession();
      } else {
        // Al volver a la ventana: restauración silenciosa de scroll
        if (user && mainContainerRef.current) {
          const page = sessionStateRef.current.currentPage;
          const targetScroll = sessionStateRef.current.scrollPositions[page] || 0;
          mainContainerRef.current.scrollTop = targetScroll;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, saveSession]);

  const resetSession = useCallback(() => {
    if (user) {
      limpiarSesion(user.id);
    }
    setCurrentPageState(defaultPage);
    setScrollPositions({});
    setActiveFilters({});
    setActiveGameIdState(null);
    setActiveMovementIdState(null);
    setIsRestored(false);
  }, [user, defaultPage]);

  return {
    currentPage,
    setCurrentPage,
    setPageFilter,
    getPageFilter,
    activeGameId,
    setActiveGameId,
    activeMovementId,
    setActiveMovementId,
    isRestored,
    resetSession,
    mainContainerRef,
  };
}
