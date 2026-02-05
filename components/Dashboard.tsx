
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { MOVEMENT_LIBRARY } from '../constants/movements';

interface DashboardProps {
  progress: {
    mentalClarity: number;
    backHealth: number;
    sessionsCompleted: number;
  };
  onStartRitual: () => void;
  t: (key: any) => string;
  lang: string;
}

const Dashboard: React.FC<DashboardProps> = ({ progress, onStartRitual, t, lang }) => {
  const [insight, setInsight] = useState(t('loadingIntelligence'));

  useEffect(() => {
    setInsight(t('loadingIntelligence'));
    geminiService.generateBrainInsight('Optimal', lang).then(setInsight);
  }, [lang]);

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-white text-4xl font-black leading-tight tracking-tight">{t('brainVitalityMap')}</h1>
          <p className="text-accent-cyan text-base font-medium">{t('currentState')}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest">{t('focusLevel')}</span>
            <span className="text-white font-bold">{progress.sessionsCompleted > 0 ? '94%' : '88%'}</span>
          </div>
          <div className="w-px h-8 bg-[#233648] {t('neuralLoad')} "></div>
          <div className="flex flex-col items-end">
            <span className="text-[#92adc9] text-[10px] uppercase font-bold tracking-widest">SESSIONS</span>
            <span className="text-white font-bold">{progress.sessionsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden border border-[#233648] bg-black/40 shadow-2xl group cursor-pointer hover:border-primary/50 transition-all">
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-60 z-10"></div>
        <img src="https://picsum.photos/seed/brain/1200/500" alt="Neural Map" className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700" />
        
        <div className="absolute top-6 right-6 z-20 max-w-xs p-4 glass-panel rounded-xl text-[10px] leading-relaxed italic text-accent-cyan border border-accent-cyan/20">
          "{insight}"
        </div>

        <div className="absolute bottom-6 left-6 z-20 flex gap-4">
          <div className="px-4 py-2 bg-background-dark/80 backdrop-blur rounded-lg border border-[#233648] flex items-center gap-3">
            <div className="size-2 rounded-full bg-accent-teal animate-pulse"></div>
            <span className="text-xs font-bold text-white tracking-wide uppercase">NEURAL COHERENCE: HIGH</span>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-white text-xl font-bold mb-6">{t('dailyTargets')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-dark p-6 rounded-2xl border border-[#233648] relative overflow-hidden group transition-all hover:bg-white/5">
            <div className="relative z-10">
              <p className="text-[#92adc9] text-sm font-semibold mb-1">{t('mentalClarity')}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-3xl font-black text-white">{progress.mentalClarity}</h3>
                <span className="text-[#92adc9] text-sm">/ 5.0 index</span>
              </div>
              <div className="w-full bg-[#233648] h-1.5 rounded-full">
                <div className="bg-accent-cyan h-full rounded-full transition-all duration-1000" style={{ width: `${(progress.mentalClarity / 5) * 100}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-card-dark p-6 rounded-2xl border border-[#233648] relative overflow-hidden group transition-all hover:bg-white/5">
            <div className="relative z-10">
              <p className="text-[#92adc9] text-sm font-semibold mb-1">{t('backHealth')}</p>
              <div className="flex items-baseline gap-2 mb-4">
                <h3 className="text-3xl font-black text-white">{progress.backHealth}</h3>
                <span className="text-[#92adc9] text-sm">% of target reached</span>
              </div>
              <div className="w-full bg-[#233648] h-1.5 rounded-full">
                <div className="bg-accent-teal h-full rounded-full transition-all duration-1000" style={{ width: `${progress.backHealth}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">{t('suggestedFixes')}</h2>
          <button onClick={onStartRitual} className="text-primary text-sm font-bold hover:underline">{t('viewLibrary')}</button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {MOVEMENT_LIBRARY.slice(0, 3).map((m) => (
            <div key={m.id} onClick={onStartRitual} className="min-w-[280px] cursor-pointer bg-card-dark rounded-2xl border border-[#233648] p-5 flex flex-col gap-4 hover:border-primary transition-all group">
              <div className="size-14 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl">{m.icon}</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">{m.title}</h4>
                <p className="text-[#92adc9] text-xs line-clamp-1">{m.description}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-accent-teal text-[10px] font-bold uppercase">{m.duration} SESSION</span>
                <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
