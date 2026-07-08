
import React, { useState } from 'react';
import { MOVEMENT_LIBRARY } from '../constants/movements';
import { Movement, MovementCategory } from '../types';
import { geminiService } from '../services/geminiService';

interface MovementEngineProps {
  onSelectMovement: (m: Movement) => void;
  t: (key: any) => string;
  lang: string;
}

const MovementEngine: React.FC<MovementEngineProps> = ({ onSelectMovement, t, lang }) => {
  const [filter, setFilter] = useState<MovementCategory | 'All'>('All');
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'why' | 'how'>('why');
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const categories: { label: string; value: MovementCategory | 'All' }[] = [
    { label: t('all'), value: 'All' },
    { label: t('spine'), value: 'Spine' },
    { label: t('focus'), value: 'Focus' },
    { label: t('decompression'), value: 'Decompression' },
    { label: t('eyes'), value: 'Eyes' },
    { label: t('energy'), value: 'Energy' }
  ];

  const filteredMovements = filter === 'All' 
    ? MOVEMENT_LIBRARY 
    : MOVEMENT_LIBRARY.filter(m => m.category === filter);

  const handleInfo = async (e: React.MouseEvent, m: Movement, type: 'why' | 'how') => {
    e.stopPropagation();
    
    // Toggle behavior if clicking the same tab on same card
    if (explainingId === m.id && activeTab === type && content) {
      setExplainingId(null);
      return;
    }

    setExplainingId(m.id);
    setActiveTab(type);
    setContent(null);
    setLoading(true);
    
    try {
      if (type === 'why') {
        const why = await geminiService.explainMovement(m.title, m.neuroBenefit, lang);
        setContent(why);
      } else {
        const how = await geminiService.generateInstructions(m.title, m.category, lang);
        setContent(how);
      }
    } catch (err) {
      setContent(lang === 'es' ? "Error al obtener datos técnicos." : "Error fetching technical data.");
    } finally {
      setLoading(false);
    }
  };

  const getIntensityLabel = (intensity: string) => {
    if (intensity === 'High') return t('intensityHigh');
    if (intensity === 'Medium') return t('intensityMedium');
    return t('intensityLow');
  };

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-content text-4xl font-black leading-tight tracking-tight">{t('movementEngine')}</h1>
        <p className="text-[#92adc9] text-base">{t('movementEngineSubtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              filter === cat.value 
                ? 'bg-primary border-primary text-content shadow-lg shadow-primary/20' 
                : 'border-[#233648] text-[#92adc9] hover:border-white/20'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovements.map((m) => (
          <div 
            key={m.id}
            onClick={() => onSelectMovement(m)}
            className={`group relative cursor-pointer bg-card-dark rounded-2xl border transition-all p-6 flex flex-col gap-4 hover:shadow-2xl hover:-translate-y-1 ${
              m.recommended ? 'border-primary/40 bg-primary/5' : 'border-[#233648] hover:border-white/20'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className={`size-12 rounded-xl flex items-center justify-center ${m.recommended ? 'bg-primary text-content' : 'bg-[#233648] text-primary'}`}>
                <span className="material-symbols-outlined text-2xl">{m.icon}</span>
              </div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                m.intensity === 'High' ? 'bg-red-500/20 text-red-400' : 
                m.intensity === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {getIntensityLabel(m.intensity)} {t('intensity')}
              </span>
            </div>

            <div>
              <h3 className="text-content font-bold text-lg group-hover:text-primary transition-colors">{m.title}</h3>
              <p className="text-[#92adc9] text-xs leading-relaxed mt-1">{m.description}</p>
            </div>

            <div className="mt-auto pt-4 border-t border-[#233648] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => handleInfo(e, m, 'why')}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${explainingId === m.id && activeTab === 'why' ? 'bg-primary text-content shadow-sm' : 'text-primary hover:bg-primary/10'}`}
                >
                  <span className="material-symbols-outlined text-[12px]">science</span>
                  {t('why')}
                </button>
                <button 
                  onClick={(e) => handleInfo(e, m, 'how')}
                  className={`text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 ${explainingId === m.id && activeTab === 'how' ? 'bg-accent-teal text-content shadow-sm' : 'text-accent-teal hover:bg-accent-teal/10'}`}
                >
                  <span className="material-symbols-outlined text-[12px]">play_lesson</span>
                  {t('how')}
                </button>
              </div>
              
              {explainingId === m.id && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 animate-in slide-in-from-top-2">
                  {loading ? (
                    <div className="flex items-center gap-2 text-[10px] text-content/50">
                      <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                      {lang === 'es' ? 'Procesando...' : 'Processing...'}
                    </div>
                  ) : (
                    <div className="text-[11px] text-content/80 leading-relaxed">
                      {activeTab === 'how' && Array.isArray(content) ? (
                        <ul className="list-decimal pl-4 space-y-1">
                          {content.map((step, i) => <li key={i}>{step}</li>)}
                        </ul>
                      ) : (
                        <p>{content}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovementEngine;
