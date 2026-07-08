
import React, { useState, useEffect, useCallback } from 'react';
import { Page, User, MindGameSession } from '../types';
import { getSessionHistory, getMindGameHistory } from '../services/supabase';
import { calculateWellnessMetrics, PhysicalSession } from '../utils/wellnessMetrics';

interface SidebarProps {
  onNavigate: (page: Page) => void;
  currentPage: Page;
  t: (key: any) => string;
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate, currentPage, t, isOpen, onClose, user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [physicalHistory, setPhysicalHistory] = useState<PhysicalSession[]>([]);
  const [mentalHistory, setMentalHistory] = useState<MindGameSession[]>([]);

  const loadHistories = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [physRes, mentRes] = await Promise.all([
        getSessionHistory(user.id),
        getMindGameHistory(user.id, 20)
      ]);

      if (physRes.error) throw physRes.error;
      if (mentRes.error) throw mentRes.error;

      setPhysicalHistory((physRes.data || []) as PhysicalSession[]);
      setMentalHistory((mentRes.data || []) as MindGameSession[]);
    } catch (err) {
      console.error('Error loading sidebar wellness history:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadHistories();
  }, [loadHistories, user.progress.sessionsCompleted, user.progress.mentalClarity, user.progress.backHealth]);

  const metrics = calculateWellnessMetrics(user, physicalHistory, mentalHistory);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 md:relative z-50 md:z-auto
        w-72 md:w-80 h-full
        border-r border-border bg-background p-6 flex flex-col gap-8
        transition-transform duration-300 ease-in-out overflow-y-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-primary">
            <img src="/Logo.jpg" alt="Logo" className="size-8 rounded-full object-cover" />
            <h2 className="text-content text-lg font-bold">NeuroBreak</h2>
          </div>
          <button onClick={onClose} className="text-muted">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex flex-col gap-6">
          {error && (
            <div className="text-center bg-red-500/10 border border-red-500/20 py-1.5 px-3 rounded-lg text-[10px] text-red-400 flex items-center justify-center gap-1.5 animate-pulse">
              <span className="material-symbols-outlined text-xs">cloud_off</span>
              {t('liveDataUnavailable')}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <h3 className="text-muted text-xs font-bold uppercase tracking-widest">{t('fatigueMonitoring')}</h3>
            <div className="bg-surface p-4 rounded-xl border border-border">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium">{t('cognitiveFatigue')} (MF)</span>
                <span className={`text-xl font-bold ${
                  metrics.cognitiveFatigueLabel === 'High' ? 'text-red-400' :
                  metrics.cognitiveFatigueLabel === 'Mid' ? 'text-amber-400' : 'text-accent-teal'
                }`}>
                  {t(
                    metrics.cognitiveFatigueLabel === 'High' ? 'levelHigh' :
                    metrics.cognitiveFatigueLabel === 'Mid' ? 'levelMid' : 'levelLow'
                  )}
                </span>
              </div>
              <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    metrics.cognitiveFatigueLabel === 'High' ? 'bg-red-400' :
                    metrics.cognitiveFatigueLabel === 'Mid' ? 'bg-amber-400' : 'bg-accent-teal'
                  }`}
                  style={{ width: `${metrics.cognitiveFatigueScore}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] text-muted">
                  Homeostasis: {loading ? t('homeostasisLoading') : t(metrics.homeostasisLabel === 'Stressed' ? 'homeostasisStressed' : 'homeostasisStable')}
                </p>
                <p className="text-[10px] text-muted font-mono">{metrics.cognitiveFatigueScore}%</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className={`border p-4 rounded-xl flex items-start gap-3 transition-colors duration-500 ${
              metrics.ergonomicRiskLabel === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              metrics.ergonomicRiskLabel === 'Mid' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <span className={`material-symbols-outlined text-xl ${
                metrics.ergonomicRiskLabel === 'High' ? 'text-red-500' :
                metrics.ergonomicRiskLabel === 'Mid' ? 'text-amber-500' :
                'text-emerald-500'
              }`}>
                {metrics.ergonomicRiskLabel === 'Low' ? 'check_circle' : 'warning'}
              </span>
              <div>
                <p className={`text-sm font-bold ${
                  metrics.ergonomicRiskLabel === 'High' ? 'text-red-400' :
                  metrics.ergonomicRiskLabel === 'Mid' ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {t('riskAlert')} ({t(
                    metrics.ergonomicRiskLabel === 'High' ? 'levelHigh' :
                    metrics.ergonomicRiskLabel === 'Mid' ? 'levelMid' : 'levelLow'
                  )})
                </p>
                <p className={`text-[11px] leading-relaxed mt-0.5 ${
                  metrics.ergonomicRiskLabel === 'High' ? 'text-red-200/70' :
                  metrics.ergonomicRiskLabel === 'Mid' ? 'text-amber-200/70' :
                  'text-emerald-200/70'
                }`}>
                  {t(metrics.ergonomicRiskMessageKey)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <h3 className="text-muted text-xs font-bold uppercase tracking-widest">Core Navigation</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => { onNavigate(Page.DASHBOARD); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.DASHBOARD ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-border'}`}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <p className="text-sm">{t('dashboard')}</p>
              </button>
              <button
                onClick={() => { onNavigate(Page.INSIGHTS); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.INSIGHTS ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-border'}`}
              >
                <span className="material-symbols-outlined">psychology</span>
                <p className="text-sm">{t('cognitiveLab')}</p>
              </button>
              <button
                onClick={() => { onNavigate(Page.MOVEMENT_ENGINE); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.MOVEMENT_ENGINE ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-border'}`}
              >
                <span className="material-symbols-outlined">exercise</span>
                <p className="text-sm">{t('movementEngine')}</p>
              </button>
              <button
                onClick={() => { onNavigate(Page.MIND_GAMES); onClose(); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentPage === Page.MIND_GAMES ? 'bg-primary/20 text-primary font-bold' : 'text-muted hover:bg-border'}`}
              >
                <span className="material-symbols-outlined">neurology</span>
                <p className="text-sm">{t('mindGames')}</p>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={() => { onNavigate(Page.MOVEMENT_ENGINE); onClose(); }}
            className="w-full bg-primary hover:bg-primary/90 text-content rounded-xl h-12 font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">play_circle</span>
            {t('startFlow')}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
