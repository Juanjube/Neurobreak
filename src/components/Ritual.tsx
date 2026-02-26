
import React, { useState, useEffect, useRef } from 'react';
import { Movement } from '../types';
import { geminiService } from '../services/geminiService';

interface RitualProps {
  movement?: Movement | null;
  onBack: () => void;
  onComplete: () => void;
  t: (key: any) => string;
  lang: string;
}

const Ritual: React.FC<RitualProps> = ({ movement, onBack, onComplete, t, lang }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [loadingCoach, setLoadingCoach] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (movement) {
      setTimeLeft(movement.durationSeconds);
      setLoadingCoach(true);
      geminiService.generateInstructions(movement.title, movement.category, lang)
        .then(steps => {
          setInstructions(steps);
          setLoadingCoach(false);
        })
        .catch(() => setLoadingCoach(false));
    }
  }, [movement, lang]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  if (!movement) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startSession = () => {
    setIsActive(true);
    setIsFinished(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-start animate-in zoom-in-95 duration-500">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#92adc9] hover:text-white transition-colors text-sm font-bold w-fit"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          {t('abortMission')}
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-xs">settings_accessibility</span>
            {movement.category} {isActive ? t('inProgress').toUpperCase() : 'ACTIVE'}
          </div>
          <h1 className="text-white text-4xl lg:text-5xl font-bold leading-tight">{movement.title}</h1>
          <p className="text-white/60 text-lg">{movement.description}</p>
        </div>

        <div className="glass-panel p-2 rounded-2xl shadow-2xl relative group overflow-hidden">
          <div className="relative flex items-center justify-center aspect-video rounded-xl overflow-hidden bg-black/40">
            <img 
              src={`https://picsum.photos/seed/${movement.id}/1200/675`} 
              alt={movement.title} 
              className={`w-full h-full object-cover transition-all duration-1000 ${isActive ? 'scale-110 brightness-75' : 'grayscale brightness-50'}`} 
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
              {!isActive && !isFinished && (
                <button 
                  onClick={startSession}
                  className="size-24 rounded-full bg-primary text-white shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
                >
                  <span className="material-symbols-outlined !text-5xl">play_arrow</span>
                </button>
              )}
              
              {(isActive || isFinished) && (
                <div className="text-center">
                  <div className="text-7xl font-black text-white tabular-nums drop-shadow-2xl">
                    {formatTime(timeLeft)}
                  </div>
                  {isFinished && (
                    <div className="mt-4 text-accent-teal font-black text-xl animate-bounce">
                      {t('sessionOptimized')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 px-6 py-6 bg-gradient-to-t from-black/80 to-transparent z-30">
              <div className="flex h-1.5 items-center justify-center mb-3">
                <div 
                  className="h-1.5 rounded-full bg-primary transition-all duration-300" 
                  style={{ width: `${((movement.durationSeconds - timeLeft) / movement.durationSeconds) * 100}%` }}
                ></div>
                <div className="h-1.5 flex-1 rounded-full bg-white opacity-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Guía de Ejecución Real-Time */}
        <div className="glass-panel p-8 rounded-2xl border-l-4 border-l-primary">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">psychology</span>
            <h3 className="text-xl font-bold text-white">{t('coachGuidance')}: {t('howToPerform')}</h3>
          </div>
          
          {loadingCoach ? (
            <div className="space-y-4">
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {instructions.map((step, idx) => (
                <div key={idx} className="flex flex-col gap-3 group">
                  <div className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border border-primary/30 group-hover:bg-primary group-hover:text-white transition-all">
                    {idx + 1}
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
        <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6">
          <div className="space-y-1">
            <h2 className="text-white text-2xl font-bold">{t('sessionState')}</h2>
            <p className="text-white/50 text-sm">
              {isActive ? t('modulatingWaves') : t('waitingTrigger')}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-accent-cyan">neurology</span>
              <span className="text-xs font-bold text-white">{t('targetMetric')}</span>
            </div>
            <p className="text-sm text-white/80 italic">{t('neuroBenefitLabel')}: "{movement.neuroBenefit}"</p>
          </div>

          {!isFinished ? (
            <button 
              disabled={isActive}
              onClick={startSession}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${isActive ? 'bg-[#233648] text-[#92adc9] cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white active:scale-95'}`}
            >
              {isActive ? t('inProgress') : t('startSession')}
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="w-full bg-accent-teal hover:bg-accent-teal/90 text-background-dark font-black py-4 rounded-xl shadow-lg animate-in zoom-in-95"
            >
              {t('finishSync')}
            </button>
          )}
        </div>
        
        <div className="p-6 bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl">
          <h4 className="text-accent-cyan text-xs font-bold uppercase tracking-widest mb-3">{t('bioSafetyTip')}</h4>
          <p className="text-white/70 text-xs leading-relaxed">
            {t('safetyWarning')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Ritual;
