import React, { useEffect, useMemo, useState } from 'react';
import { MindGameSession, User } from '../types';
import { getMindGameHistory, getSessionHistory } from '../services/supabase';

interface PhysicalSession {
  id: string;
  duration: number;
  completed_at: string;
}

interface ProfileProps {
  user: User;
  onOpenSettings: () => void;
}

type Period = 'month' | 'quarter' | 'year';

const Profile: React.FC<ProfileProps> = ({ user, onOpenSettings }) => {
  const [period, setPeriod] = useState<Period>('month');
  const [physicalHistory, setPhysicalHistory] = useState<PhysicalSession[]>([]);
  const [mentalHistory, setMentalHistory] = useState<MindGameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const isSpanish = user.language === 'es';

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setHistoryUnavailable(false);
      try {
        const [physical, mental] = await Promise.all([
          getSessionHistory(user.id),
          getMindGameHistory(user.id, 50),
        ]);

        if (physical.error || mental.error) throw physical.error || mental.error;
        if (!active) return;
        setPhysicalHistory((physical.data || []) as PhysicalSession[]);
        setMentalHistory((mental.data || []) as MindGameSession[]);
      } catch (error) {
        console.error('Unable to load profile history:', error);
        if (active) setHistoryUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHistory();
    return () => { active = false; };
  }, [user.id]);

  const activity = useMemo(() => {
    const days = period === 'month' ? 28 : period === 'quarter' ? 84 : 365;
    const bucketCount = period === 'year' ? 12 : 8;
    const bucketSize = Math.ceil(days / bucketCount);
    const now = new Date();
    const minimumDate = new Date(now);
    minimumDate.setDate(now.getDate() - days);
    const buckets = Array.from({ length: bucketCount }, () => 0);
    const events = [...physicalHistory, ...mentalHistory];

    events.forEach((event) => {
      const completedAt = new Date(event.completed_at);
      if (Number.isNaN(completedAt.getTime()) || completedAt < minimumDate) return;
      const elapsedDays = Math.floor((now.getTime() - completedAt.getTime()) / 86_400_000);
      const index = Math.min(bucketCount - 1, Math.floor(elapsedDays / bucketSize));
      buckets[bucketCount - 1 - index] += 1;
    });

    const completed = events.filter((event) => new Date(event.completed_at) >= minimumDate).length;
    const totalMinutes = events.reduce((total, event) => total + (Number(event.duration) || 0), 0) / 60;
    return { buckets, completed, totalMinutes };
  }, [period, physicalHistory, mentalHistory]);

  const metrics = useMemo(() => {
    const focus = Math.round(Math.min(100, 70 + user.progress.mentalClarity * 3));
    const consistency = Math.round(Math.min(100, (activity.completed / (period === 'month' ? 8 : period === 'quarter' ? 24 : 96)) * 100));
    return {
      focus,
      recovery: Math.round(user.progress.backHealth),
      hours: (activity.totalMinutes / 60).toFixed(1),
      consistency,
    };
  }, [activity.completed, activity.totalMinutes, period, user.progress.backHealth, user.progress.mentalClarity]);

  const exportReport = () => {
    const title = isSpanish ? 'Informe de perfil NeuroBreak' : 'NeuroBreak profile report';
    const report = [
      title,
      `${isSpanish ? 'Usuario' : 'User'}: ${user.name}`,
      `${isSpanish ? 'Objetivo' : 'Goal'}: ${user.goal || '-'}`,
      `${isSpanish ? 'Claridad mental' : 'Mental clarity'}: ${user.progress.mentalClarity}/10`,
      `${isSpanish ? 'Salud postural' : 'Back health'}: ${user.progress.backHealth}%`,
      `${isSpanish ? 'Sesiones completadas' : 'Sessions completed'}: ${user.progress.sessionsCompleted}`,
      `${isSpanish ? 'Actividad del periodo' : 'Period activity'}: ${activity.completed}`,
      `${isSpanish ? 'Horas de actividad' : 'Activity hours'}: ${metrics.hours}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neurobreak-profile-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const maximumActivity = Math.max(...activity.buckets, 1);
  const goalLabel = user.goal || (isSpanish ? 'Define tu objetivo' : 'Set your goal');
  const periodLabels: Record<Period, string> = isSpanish
    ? { month: 'Mes', quarter: 'Trimestre', year: 'Año' }
    : { month: 'Month', quarter: 'Quarter', year: 'Year' };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-[0.18em]">
            <span className="material-symbols-outlined text-base">account_circle</span>
            NeuroBreak
          </p>
          <h1 className="mt-2 text-content text-3xl font-black tracking-tight">{isSpanish ? 'Centro de perfil personal' : 'Personal Profile Hub'}</h1>
          <p className="mt-1 text-muted text-sm">{isSpanish ? 'Visualiza tu progreso físico y cognitivo en un solo lugar.' : 'See your physical and cognitive progress in one place.'}</p>
        </div>
        <button onClick={onOpenSettings} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-content">
          <span className="material-symbols-outlined text-lg">edit</span>
          {isSpanish ? 'Editar perfil' : 'Edit profile'}
        </button>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 md:p-7">
        <div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/50 bg-primary/15 shadow-lg shadow-primary/10">
              <img src={user.avatar || '/Logo.jpg'} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.src = '/Logo.jpg'; }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-content text-2xl font-black break-all">{user.name}</h2>
                <span className="rounded-full bg-accent-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-teal">{isSpanish ? 'Activo' : 'Active'}</span>
              </div>
              <p className="mt-1 text-sm text-muted break-all">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-[10px] font-bold text-muted"><span className="material-symbols-outlined text-sm text-primary">psychology</span>{goalLabel}</span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/50 px-2.5 py-1 text-[10px] font-bold text-muted"><span className="material-symbols-outlined text-sm text-primary">language</span>{user.language === 'es' ? 'Español' : 'English'}</span>
              </div>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{isSpanish ? 'Resiliencia semanal' : 'Weekly resilience'}</p>
            <p className="mt-1 text-3xl font-black text-primary">{metrics.focus}<span className="text-base">%</span></p>
            <p className="text-xs text-muted">{isSpanish ? 'basada en tu claridad mental' : 'based on mental clarity'}</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-content font-black"><span className="material-symbols-outlined text-primary">favorite</span>{isSpanish ? 'Perfil biológico' : 'Biological profile'}</h2>
              <p className="mt-1 text-xs text-muted">{isSpanish ? 'Indicadores de bienestar registrados en NeuroBreak.' : 'Wellness indicators recorded in NeuroBreak.'}</p>
            </div>
            <button onClick={onOpenSettings} className="text-xs font-bold text-primary hover:underline">{isSpanish ? 'Editar perfil' : 'Edit profile'}</button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard icon="neurology" label={isSpanish ? 'Claridad mental' : 'Mental clarity'} value={`${user.progress.mentalClarity.toFixed(1)}/10`} tone="primary" />
            <MetricCard icon="accessibility_new" label={isSpanish ? 'Salud postural' : 'Back health'} value={`${user.progress.backHealth}%`} tone="teal" />
            <MetricCard icon="bolt" label={isSpanish ? 'Sesiones' : 'Sessions'} value={String(user.progress.sessionsCompleted)} tone="cyan" />
          </div>
          <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-content">{isSpanish ? 'Estado de bienestar' : 'Wellness state'}</p>
                <p className="mt-1 text-xs text-muted">{isSpanish ? 'Progreso compuesto según tu actividad y objetivos.' : 'Composite progress based on your activity and goals.'}</p>
              </div>
              <span className="text-sm font-black text-primary">{Math.round((user.progress.mentalClarity / 10) * 50 + user.progress.backHealth * 0.5)}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan transition-all duration-700" style={{ width: `${Math.round((user.progress.mentalClarity / 10) * 50 + user.progress.backHealth * 0.5)}%` }} /></div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="flex items-center gap-2 text-content font-black"><span className="material-symbols-outlined text-primary">emoji_objects</span>{isSpanish ? 'Meta cognitiva' : 'Cognitive goal'}</h2>
              <p className="mt-1 text-xs text-muted">{isSpanish ? 'Tu enfoque actual dentro de NeuroBreak.' : 'Your current focus in NeuroBreak.'}</p>
            </div>
            <button onClick={onOpenSettings} className="rounded-lg p-1 text-muted hover:bg-primary/10 hover:text-primary" aria-label={isSpanish ? 'Editar meta' : 'Edit goal'}><span className="material-symbols-outlined text-lg">edit</span></button>
          </div>
          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{isSpanish ? 'Objetivo activo' : 'Active goal'}</p>
            <p className="mt-2 text-lg font-black text-content">{goalLabel}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{isSpanish ? 'Define y ajusta tu objetivo en Configuración para personalizar tus recomendaciones.' : 'Set and adjust your goal in Settings to personalize your recommendations.'}</p>
          </div>
          <button onClick={onOpenSettings} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-xs font-bold text-muted transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"><span className="material-symbols-outlined text-base">add</span>{isSpanish ? 'Actualizar objetivo' : 'Update goal'}</button>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-content font-black"><span className="material-symbols-outlined text-primary">monitoring</span>{isSpanish ? 'Estadísticas de neuro-resiliencia' : 'Neuro-resilience statistics'}</h2>
            <p className="mt-1 text-xs text-muted">{loading ? (isSpanish ? 'Sincronizando actividad…' : 'Syncing activity…') : (historyUnavailable ? (isSpanish ? 'Mostrando datos guardados en tu perfil.' : 'Showing saved profile data.') : (isSpanish ? 'Actividad registrada durante el periodo seleccionado.' : 'Activity recorded in the selected period.'))}</p>
          </div>
          <div className="inline-flex w-full rounded-lg border border-border bg-background/50 p-1 md:w-auto">
            {(Object.keys(periodLabels) as Period[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`flex-1 rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors md:flex-none ${period === item ? 'bg-primary text-content shadow-sm' : 'text-muted hover:text-content'}`}>{periodLabels[item]}</button>)}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Summary label={isSpanish ? 'Retención de enfoque' : 'Focus retention'} value={`${metrics.focus}%`} icon="trending_up" />
          <Summary label={isSpanish ? 'Recuperación' : 'Recovery'} value={`${metrics.recovery}%`} icon="bolt" />
          <Summary label={isSpanish ? 'Horas de actividad' : 'Activity hours'} value={`${metrics.hours}h`} icon="schedule" />
          <Summary label={isSpanish ? 'Consistencia' : 'Consistency'} value={`${metrics.consistency}%`} icon="check_circle" />
        </div>
        <div className="mt-6 flex h-40 items-end gap-2 border-b border-border pb-3">
          {activity.buckets.map((value, index) => <div key={index} className="group flex h-full flex-1 items-end"><div title={`${value} ${isSpanish ? 'actividades' : 'activities'}`} className="w-full min-h-1 rounded-t bg-primary/50 transition-all duration-500 group-hover:bg-accent-cyan" style={{ height: `${Math.max(4, (value / maximumActivity) * 100)}%` }} /></div>)}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted"><span>{isSpanish ? 'Inicio' : 'Start'}</span><span>{activity.completed} {isSpanish ? 'actividades' : 'activities'}</span><span>{isSpanish ? 'Hoy' : 'Today'}</span></div>
      </section>

      <footer className="flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{isSpanish ? 'Tus datos de progreso se sincronizan con tu cuenta.' : 'Your progress data is synced with your account.'}</p>
        <button onClick={exportReport} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-content transition-colors hover:bg-primary/90"><span className="material-symbols-outlined text-base">download</span>{isSpanish ? 'Exportar informe' : 'Export report'}</button>
      </footer>
    </div>
  );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string; tone: 'primary' | 'teal' | 'cyan' }> = ({ icon, label, value, tone }) => {
  const colors = { primary: 'text-primary bg-primary/10', teal: 'text-accent-teal bg-accent-teal/10', cyan: 'text-accent-cyan bg-accent-cyan/10' };
  return <div className="rounded-xl border border-border bg-background/40 p-3"><span className={`inline-flex size-8 items-center justify-center rounded-lg ${colors[tone]}`}><span className="material-symbols-outlined text-lg">{icon}</span></span><p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-lg font-black text-content">{value}</p></div>;
};

const Summary: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p><div className="mt-1 flex items-center gap-1.5"><span className="text-2xl font-black text-content">{value}</span><span className="material-symbols-outlined text-base text-accent-teal">{icon}</span></div><div className="mt-2 h-1 rounded-full bg-border"><div className="h-full w-4/5 rounded-full bg-accent-cyan" /></div></div>;

export default Profile;
