
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { User } from '../types';

interface InsightsProps {
  t: (key: any) => string;
  lang: string;
  user: User;
}

const Insights: React.FC<InsightsProps> = ({ t, lang, user }) => {
  const [synergies, setSynergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  const fetchNewSynergy = async () => {
    setLoading(true);
    try {
      const tip = await geminiService.generateSynergyTip(lang);
      if (tip) {
        setSynergies(prev => [tip, ...prev].slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewSynergy();
    
    // Generate personalized insight
    const generateInsight = async () => {
        const level = user.progress.mentalClarity < 4 ? 'Low' : user.progress.mentalClarity < 7 ? 'Moderate' : 'High';
        try {
            const insight = await geminiService.generateBrainInsight(level, lang);
            setAiInsight(insight);
        } catch (e) {
            console.error(e);
        }
    };
    generateInsight();

  }, [lang, user.progress.mentalClarity]); 

  const synergyScore = Math.min(100, Math.round((user.progress.sessionsCompleted / 10) * 100));

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-tight">{t('brainVitalityMap')} & {t('cognitiveLab')}</h1>
        <p className="text-[#92adc9] text-base">Data-driven empowerment for long-term neuroplasticity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-2 rounded-xl border border-[#324d67] p-6 bg-white/5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#92adc9] text-sm font-medium uppercase tracking-wide">{t('vitalityEvolution')}</p>
              <h3 className="text-white text-xl font-bold">Deskercises vs. {t('mentalClarity')}</h3>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">LIVE SYNC</div>
          </div>
          <div className="mt-4">
            <p className="text-white text-[42px] font-bold leading-tight truncate">{synergyScore}% Synergy</p>
            <div className="flex gap-2 items-center">
              <p className="text-[#92adc9] text-sm">Based on {user.progress.sessionsCompleted} sessions</p>
              <p className="text-emerald-500 text-sm font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Target: 10
              </p>
            </div>
          </div>
          <div className="flex min-h-[220px] flex-col gap-8 py-4">
             {/* Simplified Visualization */}
             <div className="flex h-[160px] items-end justify-between px-4 gap-2">
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="w-full bg-[#324d67]/30 rounded-t-sm h-full relative overflow-hidden group">
                        <div 
                            className="absolute bottom-0 w-full bg-primary/50 transition-all duration-1000 group-hover:bg-primary"
                            style={{ height: `${Math.random() * 40 + 20}%` }} // Placeholder visualization
                        ></div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 p-6 bg-primary/10 text-white shadow-lg overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-lg font-bold">{t('neuralForecast')} ({user.progress.mentalClarity.toFixed(1)})</h3>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {aiInsight || (lang === 'es' ? 'Analizando patrones neuronales...' : 'Analyzing neural patterns...')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[#324d67] p-6 bg-card-dark">
            <h4 className="text-white text-sm font-bold mb-4">{t('coreMetrics')}</h4>
            <div className="space-y-4">
              {[
                { l: t('mentalClarity'), c: 'bg-primary', v: user.progress.mentalClarity, max: 10 },
                { l: 'Back Health', c: 'bg-emerald-400', v: user.progress.backHealth, max: 100 },
              ].map((m) => (
                <div key={m.l} className="flex justify-between items-center">
                  <span className="text-xs text-[#92adc9]">{m.l}</span>
                  <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`${m.c} h-1.5 rounded-full transition-all duration-1000`} style={{ width: `${(m.v / m.max) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">nutrition</span>
            <h2 className="text-white text-[22px] font-bold leading-tight">{t('synergyLab')}</h2>
          </div>
          <button 
            onClick={fetchNewSynergy}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {t('generateNewTip')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {synergies.map((item, idx) => (
            <div key={idx} className="group rounded-xl border border-[#324d67] p-5 bg-card-dark hover:border-primary transition-all animate-in slide-in-from-left-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-white/5 text-accent-cyan`}>
                  <span className="material-symbols-outlined">{item.icon || 'star'}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{item.title}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider text-accent-cyan`}>{item.subtitle}</p>
                </div>
              </div>
              <p className="text-[#92adc9] text-sm leading-relaxed mb-4 line-clamp-3">{item.description}</p>
            </div>
          ))}
          {loading && (
            <div className="h-[180px] flex items-center justify-center border border-dashed border-[#324d67] rounded-xl text-[#92adc9] text-xs">
              {lang === 'es' ? 'Sintetizando datos...' : 'Synthesizing data...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
