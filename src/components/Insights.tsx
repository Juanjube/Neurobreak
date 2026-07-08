
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { User } from '../types';
import { getSessionHistory, getMindGameHistory } from '../services/supabase';

interface InsightsProps {
  t: (key: any) => string;
  lang: string;
  user: User;
}

const Insights: React.FC<InsightsProps> = ({ t, lang, user }) => {
  const [synergies, setSynergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [chartData, setChartData] = useState<{ deskercises: number; mindGames: number }[]>(
    Array(7).fill({ deskercises: 0, mindGames: 0 })
  );
  const [chartScale, setChartScale] = useState<'optimized' | 'linear'>('optimized');

  const getBarHeight = (count: number, scale: 'optimized' | 'linear') => {
    if (scale === 'optimized') {
      if (count === 0) return 15;
      if (count === 1) return 50;
      if (count === 2) return 85;
      return 100;
    } else {
      if (count === 0) return 5;
      if (count === 1) return 33;
      if (count === 2) return 66;
      return 100;
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [sessionRes, mindGameRes] = await Promise.all([
          getSessionHistory(user.id),
          getMindGameHistory(user.id, 50)
        ]);

        if (sessionRes.data && mindGameRes.data) {
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           
           const dailyCounts = Array.from({ length: 7 }, () => ({ deskercises: 0, mindGames: 0 }));
           
           // Process Deskercises
           sessionRes.data.forEach((session: any) => {
             const sessionDate = new Date(session.completed_at);
             sessionDate.setHours(0, 0, 0, 0);
             
             const diffTime = today.getTime() - sessionDate.getTime();
             const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             
             if (diffDays >= 0 && diffDays < 7) {
                dailyCounts[6 - diffDays].deskercises += 1;
             }
           });

           // Process Mind Games
           mindGameRes.data.forEach((session: any) => {
             const sessionDate = new Date(session.completed_at);
             sessionDate.setHours(0, 0, 0, 0);
             
             const diffTime = today.getTime() - sessionDate.getTime();
             const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
             
             if (diffDays >= 0 && diffDays < 7) {
                dailyCounts[6 - diffDays].mindGames += 1;
             }
           });
           
           setChartData(dailyCounts);
        }
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };
    fetchHistory();
  }, [user.id]);

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
        <h1 className="text-content text-4xl font-black leading-tight tracking-tight">{t('brainVitalityMap')} & {t('cognitiveLab')}</h1>
        <p className="text-muted text-base">Data-driven empowerment for long-term neuroplasticity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-2 rounded-xl border border-border p-6 bg-white/5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-4 items-center">
                <p className="text-muted text-sm font-medium uppercase tracking-wide">{t('vitalityEvolution')}</p>
                <div className="flex gap-2 bg-border/30 p-1 rounded-md">
                  <button 
                    onClick={() => setChartScale('optimized')}
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${chartScale === 'optimized' ? 'bg-primary text-content' : 'text-muted hover:text-content'}`}
                  >
                    Optimized
                  </button>
                  <button 
                    onClick={() => setChartScale('linear')}
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${chartScale === 'linear' ? 'bg-primary text-content' : 'text-muted hover:text-content'}`}
                  >
                    Linear
                  </button>
                </div>
              </div>
              <h3 className="text-content text-xl font-bold mt-1">Deskercises vs. {t('mentalClarity')}</h3>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">LIVE SYNC</div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-content text-[42px] font-bold leading-tight truncate">{synergyScore}% Synergy</p>
              <div className="flex gap-2 items-center">
                <p className="text-muted text-sm">Based on {user.progress.sessionsCompleted} sessions</p>
                <p className="text-emerald-500 text-sm font-bold flex items-center">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  Target: 10
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-primary rounded-sm"></div>
                 <span className="text-muted">Deskercises</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
                 <span className="text-muted">Claridad</span>
               </div>
            </div>
          </div>
          <div className="flex min-h-[220px] flex-col gap-8 py-4">
             {/* Dynamic Visualization based on last 7 days */}
             <div className="flex h-[160px] items-end justify-between px-2 gap-3">
                {chartData.map((data, i) => (
                    <div key={i} className="flex flex-1 gap-1 h-full items-end justify-center group">
                        {/* Deskercise Bar */}
                        <div className="w-full bg-border/30 rounded-t-sm h-full relative overflow-hidden">
                            <div 
                                className="absolute bottom-0 w-full bg-primary/70 transition-all duration-1000 group-hover:bg-primary"
                                style={{ height: `${getBarHeight(data.deskercises, chartScale)}%` }}
                            ></div>
                        </div>
                        {/* Mind Game Bar */}
                        <div className="w-full bg-border/30 rounded-t-sm h-full relative overflow-hidden">
                            <div 
                                className="absolute bottom-0 w-full bg-emerald-400/70 transition-all duration-1000 group-hover:bg-emerald-400"
                                style={{ height: `${getBarHeight(data.mindGames, chartScale)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 p-6 bg-primary/10 text-content shadow-lg overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-lg font-bold">{t('neuralForecast')} ({user.progress.mentalClarity.toFixed(1)})</h3>
              </div>
              <p className="text-sm text-content/80 leading-relaxed">
                {aiInsight || (lang === 'es' ? 'Analizando patrones neuronales...' : 'Analyzing neural patterns...')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border p-6 bg-surface">
            <h4 className="text-content text-sm font-bold mb-4">{t('coreMetrics')}</h4>
            <div className="space-y-4">
              {[
                { l: t('mentalClarity'), c: 'bg-primary', v: user.progress.mentalClarity, max: 10 },
                { l: 'Back Health', c: 'bg-emerald-400', v: user.progress.backHealth, max: 100 },
              ].map((m) => (
                <div key={m.l} className="flex justify-between items-center">
                  <span className="text-xs text-muted">{m.l}</span>
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
            <h2 className="text-content text-[22px] font-bold leading-tight">{t('synergyLab')}</h2>
          </div>
          <button 
            onClick={fetchNewSynergy}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-content transition-all disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {t('generateNewTip')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {synergies.map((item, idx) => (
            <div key={idx} className="group rounded-xl border border-border p-5 bg-surface hover:border-primary transition-all animate-in slide-in-from-left-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-white/5 text-accent-cyan`}>
                  <span className="material-symbols-outlined">{item.icon || 'star'}</span>
                </div>
                <div>
                  <h4 className="text-content font-bold text-sm">{item.title}</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-wider text-accent-cyan`}>{item.subtitle}</p>
                </div>
              </div>
              <p className="text-muted text-sm leading-relaxed mb-4 line-clamp-3">{item.description}</p>
            </div>
          ))}
          {loading && (
            <div className="h-[180px] flex items-center justify-center border border-dashed border-border rounded-xl text-muted text-xs">
              {lang === 'es' ? 'Sintetizando datos...' : 'Synthesizing data...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;
