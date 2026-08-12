import React, { useState, useEffect, useRef } from 'react';

interface MusicButtonProps {
  onClick?: () => void;
}
const MusicButton: React.FC<MusicButtonProps> = ({ onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Cierra el tooltip al hacer click fuera
  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);
  const handleClick = () => {
    
    if (onClick) {
      onClick();
    } else {
      // Reemplazar este comportamiento en una futura iteración por la lógica real del reproductor de audio.
      setShowTooltip((prev) => !prev);
    }
  };
  return (
    <div className="relative flex items-end justify-end">
      {/* Tooltip / Popover */}
      {showTooltip && (
        <div
          ref={tooltipRef}
        
          className="absolute bottom-full right-0 mb-3 w-max max-w-[200px] pointer-events-auto z-10"
          role="tooltip"
        >
          
          <div className="bg-card-dark border border-[#233648] text-[#92adc9] text-xs font-medium px-4 py-2.5 rounded-xl shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-2 duration-200 whitespace-nowrap flex items-center gap-1.5">
            <span>Próximamente 🎵</span>
            {/* Arrow pointing down */}
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-card-dark border-r border-b border-[#233648] rotate-45" />
          </div>
        </div>
      )}
      {/* Floating Button — mismo estilo que el botón de chat */}
      <button
        ref={buttonRef}
        id="music-coming-soon-btn"
        aria-label="Música — Próximamente"
        onClick={handleClick}
        className="pointer-events-auto bg-primary hover:bg-primary/90 text-content p-4 rounded-full shadow-lg shadow-primary/30 transition-all hover:scale-110 active:scale-95 flex items-center justify-center group"
      >
        <span className="material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-12">
          music_note
        </span>
      </button>
    </div>
  );
};
export default MusicButton;
