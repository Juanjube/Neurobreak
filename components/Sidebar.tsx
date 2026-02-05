
import React, { useState, useEffect } from 'react';
import { Page } from '../types';

interface SidebarProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  t: (key: any) => string;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, t }) => {
  const [fatigue, setFatigue] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setFatigue(prev => {
        const delta = Math.random() * 2 - 1;
        return Math.max(10, Math.min(80, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="hidden md:flex w-80 border-r border-[#233648] bg-background-dark p-6 flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">{t('fatigueMonitoring')}</h3>
          <div className="bg-card-dark p-4 rounded-xl border border-[#233648]">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium">{t('cognitiveFatigue')} (MF)</span>
              <span className={`text-xl font-bold ${fatigue > 60 ? 'text-red-400' : 'text-accent-teal'}`}>
                {fatigue > 60 ? 'High' : fatigue > 40 ? 'Mid' : 'Low'}
              </span>
            </div>
            <div className="w-full bg-[#233648] h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${fatigue > 60 ? 'bg-red-400' : 'bg-accent-teal'}`} 
                style={{ width: `${fatigue}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-[#92adc9] mt-2">Homeostasis: {fatigue > 60 ? 'Stressed' : 'Stable'}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 text-xl">warning</span>
            <div>
              <p className="text-sm font-bold text-red-400">{t('riskAlert')}</p>
              <p className="text-[11px] text-red-200/70 leading-relaxed">Ergonomic risk detected.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <h3 className="text-[#92adc9] text-xs font-bold uppercase tracking-widest">Core Navigation</h3>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => onNavigate(Page.DASHBOARD)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.DASHBOARD ? 'bg-primary/20 text-primary font-bold' : 'text-[#92adc9] hover:bg-[#233648]'}`}
            >
              <span className="material-symbols-outlined">dashboard</span>
              <p className="text-sm">{t('dashboard')}</p>
            </button>
            <button 
              onClick={() => onNavigate(Page.INSIGHTS)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.INSIGHTS ? 'bg-primary/20 text-primary font-bold' : 'text-[#92adc9] hover:bg-[#233648]'}`}
            >
              <span className="material-symbols-outlined">psychology</span>
              <p className="text-sm">{t('cognitiveLab')}</p>
            </button>
            <button 
              onClick={() => onNavigate(Page.MOVEMENT_ENGINE)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.MOVEMENT_ENGINE ? 'bg-primary/20 text-primary font-bold' : 'text-[#92adc9] hover:bg-[#233648]'}`}
            >
              <span className="material-symbols-outlined">exercise</span>
              <p className="text-sm">{t('movementEngine')}</p>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <button 
          onClick={() => onNavigate(Page.MOVEMENT_ENGINE)}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12 font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">play_circle</span>
          {t('startFlow')}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
