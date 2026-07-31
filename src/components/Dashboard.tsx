import React, { useEffect, useState } from 'react';
import { geminiService } from '../services/geminiService';
import { MOVEMENT_LIBRARY } from '../constants/movements';
import { WellnessMetrics } from '../utils/wellnessMetrics';
import defaultHeroImage from '../../assets/images/hero/brain-vitality-map.svg';

interface DashboardProps {
  progress: {
    mentalClarity: number;
    backHealth: number;
    sessionsCompleted: number;
  };
  wellnessMetrics: WellnessMetrics;
  onStartRitual: () => void;
  t: (key: any) => string;
  lang: string;
  /** A replacement image can be dropped in assets and passed here without changing the layout. */
  heroImageSrc?: string;
}

const STATE_STYLES = {
  Optimal: 'text-accent-teal border-accent-teal/30 bg-accent-teal/10',
  Attention: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  Recovery: 'text-red-300 border-red-400/30 bg-red-400/10',
};

const movementCopy = {
  'neck-1': { title: 'Reinicio cervical', description: 'Rotaciones controladas para descomprimir las vértebras C1-C7.' },
  'eye-1': { title: 'Alivio 20-20-20', description: 'Reinicio del enfoque para la fatiga visual digital.' },
  'spine-1': { title: 'Puente torácico', description: 'Extensión profunda para corregir la postura encorvada.' },
};

const Dashboard: React.FC<DashboardProps> = ({
  progress,
  wellnessMetrics,
  onStartRitual,
  t,
  lang,
  heroImageSrc = defaultHeroImage,
}) => {
  const [insight, setInsight] = useState(t('loadingIntelligence'));
  const isSpanish = lang === 'es';
  const stateStyle = STATE_STYLES[wellnessMetrics.cognitiveState];

  useEffect(() => {
    setInsight(t('loadingIntelligence'));
    geminiService.generateBrainInsight(wellnessMetrics.cognitiveState, lang).then(setInsight);
  }, [lang, wellnessMetrics.cognitiveState]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-content text-3xl md:text-4xl font-black leading-tight tracking-tight">{t('brainVitalityMap')}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted text-sm">{t('cognitiveStateLabel')}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${stateStyle}`}>
              {t(wellnessMetrics.cognitiveStateMessageKey)}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-muted text-[10px] uppercase font-bold tracking-widest">{t('cognitiveReadiness')}</span>
            <span className="text-content font-bold">{wellnessMetrics.cognitiveReadinessScore}%</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-muted text-[10px] uppercase font-bold tracking-widest">{t('sessions')}</span>
            <span className="text-content font-bold">{progress.sessionsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-border bg-black/40 shadow-2xl group hover:border-primary/50 transition-all">
        <img src={heroImageSrc} alt={t('heroImageAlt')} className="w-full h-full object-cover opacity-80 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/10 to-transparent z-10" />

        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 max-w-xs p-4 glass-panel rounded-xl text-[10px] leading-relaxed italic text-accent-cyan border border-accent-cyan/20">
          “{insight}”
        </div>

        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-20 flex flex-col items-start gap-3">
          <div className={`px-4 py-2 rounded-lg border backdrop-blur flex items-center gap-3 ${stateStyle}`}>
            <div className={`size-2 rounded-full ${wellnessMetrics.cognitiveState === 'Optimal' ? 'bg-accent-teal animate-pulse' : wellnessMetrics.cognitiveState === 'Attention' ? 'bg-amber-300' : 'bg-red-300'}`} />
            <span className="text-xs font-bold tracking-wide uppercase">{t(wellnessMetrics.cognitiveStateMessageKey)}</span>
          </div>
          <div className="max-w-md px-4 py-3 bg-background/80 backdrop-blur rounded-lg border border-border">
            <p className="text-xs font-bold text-content">{t('neuralCoherence')}: {wellnessMetrics.neuralCoherenceScore}%</p>
            <p className="mt-1 text-[10px] text-muted">{t('neuralCoherenceExplanation')}</p>
          </div>
          <button onClick={onStartRitual} className="bg-primary hover:bg-primary/90 text-content rounded-xl h-11 px-5 font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 active:scale-95">
            <span className="material-symbols-outlined text-xl">play_circle</span>
            {t('startFlow')}
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-content text-xl font-bold mb-6">{t('dailyTargets')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-surface p-6 rounded-2xl border border-border relative overflow-hidden group transition-all hover:bg-white/5">
            <div className="relative z-10">
              <p className="text-muted text-sm font-semibold mb-1">{t('mentalClarity')}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-3xl font-black text-content">{progress.mentalClarity}</h3>
                <span className="text-muted text-sm">{t('clarityScale')}</span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full">
                <div className="bg-accent-cyan h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (progress.mentalClarity / 10) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-surface p-6 rounded-2xl border border-border relative overflow-hidden group transition-all hover:bg-white/5">
            <div className="relative z-10">
              <p className="text-muted text-sm font-semibold mb-1">{t('backHealth')}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-3xl font-black text-content">{progress.backHealth}</h3>
                <span className="text-muted text-sm">{t('targetCompleted')}</span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full">
                <div className="bg-accent-teal h-full rounded-full transition-all duration-1000" style={{ width: `${progress.backHealth}%` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-content text-xl font-bold">{t('suggestedFixes')}</h2>
          <button onClick={onStartRitual} className="text-primary text-sm font-bold hover:underline">{t('viewLibrary')}</button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {MOVEMENT_LIBRARY.slice(0, 3).map((movement) => {
            const localized = isSpanish ? movementCopy[movement.id as keyof typeof movementCopy] : undefined;
            return (
              <button key={movement.id} onClick={onStartRitual} className="min-w-[280px] text-left cursor-pointer bg-surface rounded-2xl border border-border p-5 flex flex-col gap-4 hover:border-primary transition-all group">
                <div className="size-14 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-content transition-colors">
                  <span className="material-symbols-outlined text-3xl">{movement.icon}</span>
                </div>
                <div>
                  <h4 className="text-content font-bold text-lg">{localized?.title || movement.title}</h4>
                  <p className="text-muted text-xs line-clamp-1">{localized?.description || movement.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-accent-teal text-[10px] font-bold uppercase">{movement.duration} {t('session')}</span>
                  <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
