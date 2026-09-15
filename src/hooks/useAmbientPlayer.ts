import { useCallback, useEffect, useRef, useState } from 'react';
import { AMBIENT_SOUNDS, AmbientSound } from '../constants/ambientSounds';

const VOLUME_STORAGE_KEY = 'neurobreak.ambient.volume';
const TRACK_STORAGE_KEY = 'neurobreak.ambient.track';
const DEFAULT_VOLUME = 0.5;

export type AmbientStatus = 'idle' | 'loading' | 'playing' | 'error';

const readStoredVolume = (): number => {
  try {
    const stored = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
    // Si el valor guardado está corrupto o fuera de rango volvemos al volumen por defecto.
    return Number.isFinite(stored) && stored > 0 && stored <= 1 ? stored : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
};

const readStoredTrack = (): AmbientSound | null => {
  try {
    const storedId = localStorage.getItem(TRACK_STORAGE_KEY);
    return AMBIENT_SOUNDS.find((sound) => sound.id === storedId) ?? null;
  } catch {
    return null;
  }
};

const remember = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento la preferencia solo dura lo que dure la sesión.
  }
};

/**
 * Reproductor de sonidos ambientales. Mantiene un único elemento <audio> en memoria
 * para que la música siga sonando mientras el usuario navega entre páginas.
 */
export const useAmbientPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Recordamos la última selección del usuario, pero nunca reproducimos sola:
  // los navegadores bloquean el autoplay sin interacción previa.
  const [currentSound, setCurrentSound] = useState<AmbientSound | null>(readStoredTrack);
  const [status, setStatus] = useState<AmbientStatus>('idle');
  const [volume, setVolumeState] = useState<number>(readStoredVolume);

  // Creamos el elemento de audio una sola vez y seguimos su estado real por eventos:
  // los archivos pesan decenas de MB, así que el buffering es visible para el usuario.
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = readStoredVolume();
    audioRef.current = audio;

    const onPlaying = () => setStatus('playing');
    const onWaiting = () => setStatus('loading');
    const onPause = () => setStatus('idle');
    const onError = () => setStatus('error');

    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      // Soltamos el archivo para que el navegador cancele la descarga en curso.
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setStatus('idle');
  }, []);

  const play = useCallback(async (sound: AmbientSound) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSound?.id !== sound.id || !audio.src) {
      audio.src = sound.src;
      audio.load();
      setCurrentSound(sound);
      remember(TRACK_STORAGE_KEY, sound.id);
    }

    // readyState >= 3 (HAVE_FUTURE_DATA) significa que ya hay audio suficiente para sonar.
    setStatus(audio.readyState >= 3 ? 'playing' : 'loading');

    try {
      await audio.play();
      setStatus('playing');
    } catch {
      setStatus('error');
    }
  }, [currentSound]);

  const toggle = useCallback((sound: AmbientSound) => {
    if (currentSound?.id === sound.id && (status === 'playing' || status === 'loading')) {
      stop();
      return;
    }
    void play(sound);
  }, [currentSound, play, status, stop]);

  const setVolume = useCallback((next: number) => {
    const clamped = Math.min(1, Math.max(0, next));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    remember(VOLUME_STORAGE_KEY, String(clamped));
  }, []);

  const isPlaying = status === 'playing' || status === 'loading';

  return { currentSound, status, isPlaying, volume, play, stop, toggle, setVolume };
};
