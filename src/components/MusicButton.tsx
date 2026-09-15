import React, { useState, useEffect, useRef } from 'react';
import { Language } from '../types';
import { AMBIENT_SOUNDS } from '../constants/ambientSounds';
import { useAmbientPlayer } from '../hooks/useAmbientPlayer';

interface MusicButtonProps {
  lang: Language;
}

const MusicButton: React.FC<MusicButtonProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { currentSound, status, isPlaying, volume, toggle, stop, setVolume } = useAmbientPlayer();

  const copy = (es: string, en: string) => (lang === 'es' ? es : en);

  // Cierra el panel al hacer click fuera (la música sigue sonando).
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const statusLabel = () => {
    if (status === 'loading') return copy('Cargando…', 'Loading…');
    if (status === 'error') return copy('No se pudo reproducir', 'Playback failed');
    if (status === 'playing' && currentSound) return currentSound.label[lang];
    return copy('Elige un sonido', 'Pick a sound');
  };

  return (
    <div className="relative flex flex-col items-end pointer-events-none">
      {/* Panel del reproductor */}
      {isOpen && (
        <div
          ref={panelRef}
          className="pointer-events-auto mb-4 w-72 sm:w-80 bg-card-dark border border-[#233648] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 flex flex-col"
          role="dialog"
          aria-label={copy('Sonidos de relajación', 'Relaxation sounds')}
        >
          {/* Cabecera */}
          <div className="bg-primary/10 p-4 border-b border-[#233648] flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary shrink-0">spa</span>
              <div className="min-w-0">
                <h3 className="text-content font-bold text-sm truncate">
                  {copy('Sonidos de relajación', 'Relaxation sounds')}
                </h3>
                <p className="text-[#92adc9] text-xs truncate">{statusLabel()}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label={copy('Cerrar', 'Close')}
              className="text-[#92adc9] hover:text-content transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Lista de sonidos */}
          <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1 bg-background-dark/50">
            {AMBIENT_SOUNDS.map((sound) => {
              const isActive = currentSound?.id === sound.id;
              const isActivePlaying = isActive && isPlaying;
              return (
                <button
                  key={sound.id}
                  onClick={() => toggle(sound)}
                  aria-pressed={isActivePlaying}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    isActivePlaying
                      ? 'bg-primary/20 text-content'
                      : 'text-[#92adc9] hover:bg-white/5 hover:text-content'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xl shrink-0 ${
                      isActivePlaying ? 'text-primary' : ''
                    }`}
                  >
                    {sound.icon}
                  </span>
                  <span className="flex-1 truncate font-medium">{sound.label[lang]}</span>
                  {isActive && status === 'loading' ? (
                    <span className="flex gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  ) : (
                    <span
                      className={`material-symbols-outlined text-lg shrink-0 ${
                        isActivePlaying ? 'text-primary' : 'opacity-60'
                      }`}
                    >
                      {isActivePlaying ? 'pause_circle' : 'play_circle'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Volumen y detener */}
          <div className="p-3 bg-card-dark border-t border-[#233648] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#92adc9] text-lg">volume_down</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label={copy('Volumen', 'Volume')}
              className="flex-1 h-1 accent-[color:var(--color-accent)] cursor-pointer"
            />
            <button
              onClick={stop}
              disabled={!isPlaying}
              aria-label={copy('Detener', 'Stop')}
              className="text-[#92adc9] hover:text-content disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-lg">stop_circle</span>
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante — mismo estilo que el botón de chat */}
      <button
        ref={buttonRef}
        id="music-player-btn"
        aria-label={copy('Sonidos de relajación', 'Relaxation sounds')}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative pointer-events-auto bg-primary hover:bg-primary/90 text-content p-4 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
      >
        {/* Halo que late mientras hay sonido activo */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" aria-hidden="true" />
        )}
        <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-12 relative">
          {isPlaying ? 'graphic_eq' : 'music_note'}
        </span>
      </button>
    </div>
  );
};

export default MusicButton;
