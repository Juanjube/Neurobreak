import React, { useMemo, useState } from 'react';
import { MindGameSession, User } from '../types';
import { PhysicalSession } from '../utils/wellnessMetrics';
import { GOALS, GoalId, goalLabel, toGoalId } from '../constants/goals';

interface ProfileProps {
  user: User;
  physicalHistory: PhysicalSession[];
  mentalHistory: MindGameSession[];
  historyLoading: boolean;
  historyError: boolean;
  onEditProfile: () => void;
  onOpenSettings: () => void;
  onUpdateGoal: (goal: GoalId) => Promise<void>;
}

type Period = 'month' | 'quarter' | 'year';

// Días que cubre cada periodo y actividad esperada dentro de él. La consistencia se mide
// contra este objetivo, así que conviene tenerlo a la vista y no escondido en la fórmula.
const PERIODS: Record<Period, { days: number; buckets: number; targetActivities: number; targetHours: number }> = {
  month: { days: 28, buckets: 8, targetActivities: 8, targetHours: 4 },
  quarter: { days: 84, buckets: 8, targetActivities: 24, targetHours: 12 },
  year: { days: 365, buckets: 12, targetActivities: 96, targetHours: 48 },
};

const percentOf = (value: number, target: number) => Math.min(100, Math.round((value / target) * 100));

const Profile: React.FC<ProfileProps> = ({
  user,
  physicalHistory,
  mentalHistory,
  historyLoading,
  historyError,
  onEditProfile,
  onOpenSettings,
  onUpdateGoal,
}) => {
  const [period, setPeriod] = useState<Period>('month');
  const [savingGoal, setSavingGoal] = useState<GoalId | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaved, setGoalSaved] = useState(false);
  const isSpanish = user.language === 'es';

  const mentalClarity = user.progress?.mentalClarity ?? 0;
  const backHealth = user.progress?.backHealth ?? 0;
  const sessionsCompleted = user.progress?.sessionsCompleted ?? 0;
  const activeGoal = toGoalId(user.goal);

  const selectGoal = async (goal: GoalId) => {
    if (goal === activeGoal || savingGoal) return;
    setSavingGoal(goal);
    setGoalError(null);
    setGoalSaved(false);
    try {
      await onUpdateGoal(goal);
      setGoalSaved(true);
    } catch (error: any) {
      setGoalError(error?.message || (isSpanish ? 'No se pudo guardar el objetivo.' : 'Could not save the goal.'));
    } finally {
      setSavingGoal(null);
    }
  };

  const activity = useMemo(() => {
    const { days, buckets: bucketCount } = PERIODS[period];
    const now = new Date();
    const minimumDate = new Date(now);
    minimumDate.setDate(now.getDate() - days);
    const buckets = Array.from({ length: bucketCount }, () => 0);
    const events = [...physicalHistory, ...mentalHistory];
    let completed = 0;
    let totalMinutes = 0;

    events.forEach((event) => {
      const completedAt = new Date(event.completed_at);
      if (Number.isNaN(completedAt.getTime()) || completedAt < minimumDate) return;

      completed += 1;
      totalMinutes += (Number(event.duration) || 0) / 60;

      // Repartimos el periodo completo entre los buckets para que el último sea siempre "hoy".
      const elapsedDays = (now.getTime() - completedAt.getTime()) / 86_400_000;
      const index = Math.min(bucketCount - 1, Math.floor((elapsedDays / days) * bucketCount));
      buckets[bucketCount - 1 - index] += 1;
    });

    return { buckets, completed, totalMinutes };
  }, [period, physicalHistory, mentalHistory]);

  const metrics = useMemo(() => {
    const { targetActivities, targetHours } = PERIODS[period];
    const hours = activity.totalMinutes / 60;
    return {
      // La claridad mental se registra sobre 10; la mostramos sobre 100 sin inventar sumas.
      focus: Math.round(mentalClarity * 10),
      recovery: Math.round(backHealth),
      hours,
      hoursPercent: percentOf(hours, targetHours),
      consistency: percentOf(activity.completed, targetActivities),
    };
  }, [activity.completed, activity.totalMinutes, backHealth, mentalClarity, period]);

  const wellness = Math.round((mentalClarity / 10) * 50 + backHealth * 0.5);

  const focusTone = metrics.focus >= 70
    ? { label: isSpanish ? 'En rango óptimo' : 'In optimal range', className: 'text-accent-teal' }
    : metrics.focus >= 40
      ? { label: isSpanish ? 'En progreso' : 'Building up', className: 'text-primary' }
      : { label: isSpanish ? 'Necesita atención' : 'Needs attention', className: 'text-muted' };

  const exportReport = () => {
    const title = isSpanish ? 'Informe de perfil NeuroBreak' : 'NeuroBreak profile report';
    const report = [
      title,
      `${isSpanish ? 'Usuario' : 'User'}: ${user.name}`,
      `${isSpanish ? 'Objetivo' : 'Goal'}: ${goalLabel(activeGoal, user.language)}`,
      `${isSpanish ? 'Claridad mental' : 'Mental clarity'}: ${mentalClarity}/10`,
      `${isSpanish ? 'Salud postural' : 'Back health'}: ${Math.round(backHealth)}%`,
      `${isSpanish ? 'Sesiones completadas' : 'Sessions completed'}: ${sessionsCompleted}`,
      `${isSpanish ? 'Actividad del periodo' : 'Period activity'}: ${activity.completed}`,
      `${isSpanish ? 'Horas de actividad' : 'Activity hours'}: ${metrics.hours.toFixed(1)}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'neurobreak-profile-report.txt';
    // El enlace debe estar en el DOM y la URL seguir viva cuando el navegador inicia la descarga.
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const maximumActivity = Math.max(...activity.buckets, 1);
  const periodLabels: Record<Period, string> = isSpanish
    ? { month: 'Mes', quarter: 'Trimestre', year: 'Año' }
    : { month: 'Month', quarter: 'Quarter', year: 'Year' };

  const syncBadge = historyLoading
    ? { icon: 'cloud_sync', label: isSpanish ? 'Sincronizando…' : 'Syncing…', className: 'text-muted' }
    : historyError
      ? { icon: 'cloud_off', label: isSpanish ? 'Historial no disponible' : 'History unavailable', className: 'text-muted' }
      : { icon: 'cloud_done', label: isSpanish ? 'Datos sincronizados' : 'Data synced', className: 'text-accent-teal' };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-7 flex items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-content">{isSpanish ? 'Centro de perfil personal' : 'Personal Profile Hub'}</h1>
          <p className="mt-1 text-sm text-muted">{isSpanish ? 'Gestiona tus biométricas y áreas de enfoque cognitivo.' : 'Manage your biometrics and cognitive focus areas.'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`hidden items-center gap-1.5 text-xs font-bold sm:inline-flex ${syncBadge.className}`}><span className="material-symbols-outlined text-base">{syncBadge.icon}</span>{syncBadge.label}</span>
          <button onClick={onOpenSettings} aria-label={isSpanish ? 'Abrir configuración' : 'Open settings'} className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"><span className="material-symbols-outlined text-lg">settings</span></button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-6">
          <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center">
            <div className="absolute -right-16 -top-16 size-40 rounded-full bg-primary/15 blur-3xl" />
            <div className="relative mx-auto w-fit">
              <div className="size-24 overflow-hidden rounded-full border-2 border-primary/60 bg-primary/15 shadow-lg shadow-primary/15"><img src={user.avatar || '/Logo.jpg'} alt="" className="size-full object-cover" onError={(event) => { event.currentTarget.src = '/Logo.jpg'; }} /></div>
              <button onClick={onEditProfile} aria-label={isSpanish ? 'Editar perfil' : 'Edit profile'} className="absolute -right-1 bottom-0 inline-flex size-8 items-center justify-center rounded-full border border-primary/60 bg-background text-primary transition-colors hover:bg-primary hover:text-content"><span className="material-symbols-outlined text-base">edit</span></button>
            </div>
            <h2 className="mt-4 break-words text-2xl font-black text-content">{user.name}</h2>
            <p className="mt-1 break-all text-sm text-muted">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2"><span className="rounded-full bg-accent-teal/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-teal">{isSpanish ? 'Activo' : 'Active'}</span><span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary"><span className="material-symbols-outlined text-xs">psychology</span>{goalLabel(activeGoal, user.language)}</span></div>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black text-content"><span className="material-symbols-outlined text-primary">favorite</span>{isSpanish ? 'Perfil biológico' : 'Biological profile'}</h2><button onClick={onEditProfile} className="text-xs font-bold text-primary hover:underline">{isSpanish ? 'Editar' : 'Edit'}</button></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><MetricCard icon="neurology" label={isSpanish ? 'Claridad mental' : 'Mental clarity'} value={`${mentalClarity.toFixed(1)}/10`} tone="primary" /><MetricCard icon="accessibility_new" label={isSpanish ? 'Salud postural' : 'Back health'} value={`${Math.round(backHealth)}%`} tone="teal" /></div>
            <div className="mt-4 rounded-xl border border-border bg-background/40 p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold text-content">{isSpanish ? 'Estado de bienestar' : 'Wellness state'}</p><span className="text-sm font-black text-primary">{wellness}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent-cyan transition-all duration-700" style={{ width: `${wellness}%` }} /></div></div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">{isSpanish ? 'Retención de enfoque' : 'Focus retention'}</p><p className="mt-1 text-sm text-muted">{isSpanish ? 'Tu umbral cognitivo actual' : 'Your current cognitive threshold'}</p></div><div className="text-left sm:text-right"><p className="text-3xl font-black text-primary">{metrics.focus}<span className="text-base text-muted">/100</span></p><p className={`text-xs ${focusTone.className}`}>{focusTone.label}</p></div></section>

          <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-content font-black"><span className="material-symbols-outlined text-primary">emoji_objects</span>{isSpanish ? 'Meta cognitiva' : 'Cognitive goal'}</h2>
                <p className="mt-1 text-xs text-muted">{isSpanish ? 'Elige el enfoque que quieres trabajar. Se guarda al instante.' : 'Pick the focus you want to work on. It saves instantly.'}</p>
              </div>
              {goalSaved && !savingGoal && <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-accent-teal"><span className="material-symbols-outlined text-base">check_circle</span>{isSpanish ? 'Guardado' : 'Saved'}</span>}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GOALS.map((option) => {
                const isActive = option.id === activeGoal;
                const isSaving = savingGoal === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => selectGoal(option.id)}
                    disabled={savingGoal !== null}
                    aria-pressed={isActive}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                      isActive
                        ? 'border-primary/60 bg-primary/10'
                        : 'border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60'
                    }`}
                  >
                    <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-primary/20 text-primary' : 'bg-border/40 text-muted'}`}>
                      <span className={`material-symbols-outlined text-lg ${isSaving ? 'animate-spin' : ''}`}>{isSaving ? 'progress_activity' : option.icon}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-content">{goalLabel(option.id, user.language)}</span>
                      <span className="mt-0.5 block h-3 text-[10px] font-bold uppercase tracking-widest text-primary">{isActive ? (isSpanish ? 'Objetivo activo' : 'Active goal') : ''}</span>
                    </span>
                    {isActive && <span className="material-symbols-outlined shrink-0 text-primary">check_circle</span>}
                  </button>
                );
              })}
            </div>

            {goalError && <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs font-bold text-red-400">{goalError}</p>}
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
            <div className="flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-content font-black"><span className="material-symbols-outlined text-primary">monitoring</span>{isSpanish ? 'Estadísticas de neuro-resiliencia' : 'Neuro-resilience statistics'}</h2>
                <p className="mt-1 text-xs text-muted">{historyLoading ? (isSpanish ? 'Sincronizando actividad…' : 'Syncing activity…') : (historyError ? (isSpanish ? 'No se pudo cargar tu historial; mostrando solo los datos de tu perfil.' : 'Could not load your history; showing profile data only.') : (isSpanish ? 'Actividad registrada durante el periodo seleccionado.' : 'Activity recorded in the selected period.'))}</p>
              </div>
              <div className="inline-flex w-full rounded-lg border border-border bg-background/50 p-1 md:w-auto">
                {(Object.keys(periodLabels) as Period[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`flex-1 rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors md:flex-none ${period === item ? 'bg-primary text-content shadow-sm' : 'text-muted hover:text-content'}`}>{periodLabels[item]}</button>)}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Summary label={isSpanish ? 'Retención de enfoque' : 'Focus retention'} value={`${metrics.focus}%`} percent={metrics.focus} icon="trending_up" />
              <Summary label={isSpanish ? 'Recuperación' : 'Recovery'} value={`${metrics.recovery}%`} percent={metrics.recovery} icon="bolt" />
              <Summary label={isSpanish ? 'Horas de actividad' : 'Activity hours'} value={`${metrics.hours.toFixed(1)}h`} percent={metrics.hoursPercent} icon="schedule" />
              <Summary label={isSpanish ? 'Consistencia' : 'Consistency'} value={`${metrics.consistency}%`} percent={metrics.consistency} icon="check_circle" />
            </div>
            <div className="mt-6 flex h-40 items-end gap-2 border-b border-border pb-3">
              {activity.buckets.map((value, index) => <div key={index} className="group flex h-full flex-1 items-end"><div title={`${value} ${isSpanish ? 'actividades' : 'activities'}`} className="w-full min-h-1 rounded-t bg-primary/50 transition-all duration-500 group-hover:bg-accent-cyan" style={{ height: `${Math.max(4, (value / maximumActivity) * 100)}%` }} /></div>)}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted"><span>{isSpanish ? 'Inicio' : 'Start'}</span><span>{activity.completed} {isSpanish ? 'actividades' : 'activities'}</span><span>{isSpanish ? 'Hoy' : 'Today'}</span></div>
          </section>

          <footer className="flex flex-col gap-3 border-t border-border pt-1 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{isSpanish ? 'Tus datos de progreso se sincronizan con tu cuenta.' : 'Your progress data is synced with your account.'}</p>
            <button onClick={exportReport} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-bold text-content transition-colors hover:bg-primary/90"><span className="material-symbols-outlined text-base">download</span>{isSpanish ? 'Exportar informe' : 'Export report'}</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: string; label: string; value: string; tone: 'primary' | 'teal' | 'cyan' }> = ({ icon, label, value, tone }) => {
  const colors = { primary: 'text-primary bg-primary/10', teal: 'text-accent-teal bg-accent-teal/10', cyan: 'text-accent-cyan bg-accent-cyan/10' };
  return <div className="rounded-xl border border-border bg-background/40 p-3"><span className={`inline-flex size-8 items-center justify-center rounded-lg ${colors[tone]}`}><span className="material-symbols-outlined text-lg">{icon}</span></span><p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-lg font-black text-content">{value}</p></div>;
};

// La barra refleja el valor real de la métrica, no un ancho decorativo.
const Summary: React.FC<{ label: string; value: string; icon: string; percent: number }> = ({ label, value, icon, percent }) => <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p><div className="mt-1 flex items-center gap-1.5"><span className="text-2xl font-black text-content">{value}</span><span className="material-symbols-outlined text-base text-accent-teal">{icon}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-accent-cyan transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div></div>;

export default Profile;
