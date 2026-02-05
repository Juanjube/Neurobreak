
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';

interface InsightsProps {
  t: (key: any) => string;
  lang: string;
}

const Insights: React.FC<InsightsProps> = ({ t, lang }) => {
  const [synergies, setSynergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNewSynergy = async () => {
    setLoading(true);
    try {
      const tip = await geminiService.generateSynergyTip(lang);
      setSynergies(prev => [tip, ...prev].slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refresh synergies when language changes
    fetchNewSynergy();
  }, [lang]);

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
            <p className="text-white text-[42px] font-bold leading-tight truncate">92% Synergy</p>
            <div className="flex gap-2 items-center">
              <p className="text-[#92adc9] text-sm">Real-time biomechanical analysis</p>
              <p className="text-emerald-500 text-sm font-bold flex items-center">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +12.4%
              </p>
            </div>
          </div>
          <div className="flex min-h-[220px] flex-col gap-8 py-4">
            {/* Graph logic remains same */}
            <svg fill="none" height="160" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
              <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#137fec" strokeLinecap="round" strokeWidth="3"></path>
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="236" x2="236" y1="1" y2="149">
                  <stop stopColor="#137fec" stopOpacity="0.3"></stop>
                  <stop offset="1" stopColor="#137fec" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-primary/30 p-6 bg-primary/10 text-white shadow-lg overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                <h3 className="text-lg font-bold">{t('neuralForecast')}</h3>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">AI predicts a 14% drop in focus in 45 minutes. Schedule a 2m Cervical Reset now.</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#324d67] p-6 bg-card-dark">
            <h4 className="text-white text-sm font-bold mb-4">{t('coreMetrics')}</h4>
            <div className="space-y-4">
              {[
                { l: 'Synaptic Density', c: 'bg-primary', w: '75%' },
                { l: 'Cortisol Regulation', c: 'bg-emerald-400', w: '90%' },
              ].map((m) => (
                <div key={m.l} className="flex justify-between items-center">
                  <span className="text-xs text-[#92adc9]">{m.l}</span>
                  <div className="w-32 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`${m.c} h-1.5 rounded-full transition-all duration-1000`} style={{ width: m.w }}></div>
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
