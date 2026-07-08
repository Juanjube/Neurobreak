import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { firstValidationError, profileSchema } from '../utils/validation';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
  t: (key: any) => string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser, t }) => {
  const [formData, setFormData] = useState<User>(user);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = profileSchema.safeParse(formData);
    if (!parsed.success) {
      setError(firstValidationError(parsed.error));
      setSaved(false);
      return;
    }

    try {
      await onUpdateUser(parsed.data as User);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setSaved(false);
      setError(err?.message || 'Could not save settings.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const goalOptions = [
    { value: 'Deep Work', label: t('goalDeepWork'), icon: 'bolt' },
    { value: 'Creative Flow', label: t('goalCreativeFlow'), icon: 'neurology' },
    { value: 'Back Health', label: t('goalSpinalRecovery'), icon: 'accessibility_new' },
    { value: 'Stress Management', label: t('goalVagusNerve'), icon: 'self_improvement' },
  ];

  const isSpanish = formData.language === 'es';

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">tune</span>
            NeuroBreak Control
          </div>
          <h1 className="text-content text-3xl md:text-4xl font-black leading-tight tracking-tight">{t('settings')}</h1>
          <p className="text-[#92adc9] text-sm md:text-base max-w-2xl">
            {isSpanish
              ? 'Ajusta tu identidad, preferencias y objetivo de bienestar sin salir del flujo.'
              : 'Tune your identity, preferences, and wellness target without leaving the flow.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 min-w-full sm:min-w-[360px]">
          <div className="rounded-lg border border-[#233648] bg-card-dark p-3">
            <p className="text-[#92adc9] text-xs font-bold uppercase">{t('mentalClarity')}</p>
            <p className="text-content text-xl font-black">{formData.progress.mentalClarity.toFixed(1)}</p>
          </div>
          <div className="rounded-lg border border-[#233648] bg-card-dark p-3">
            <p className="text-[#92adc9] text-xs font-bold uppercase">{t('backHealth')}</p>
            <p className="text-content text-xl font-black">{formData.progress.backHealth}%</p>
          </div>
          <div className="rounded-lg border border-[#233648] bg-card-dark p-3">
            <p className="text-[#92adc9] text-xs font-bold uppercase">{isSpanish ? 'Sesiones' : 'Sessions'}</p>
            <p className="text-content text-xl font-black">{formData.progress.sessionsCompleted}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        <aside className="rounded-lg border border-[#233648] bg-card-dark overflow-hidden">
          <div className="p-6 bg-[#101922] border-b border-[#233648]">
            <div className="size-24 rounded-xl overflow-hidden border border-white/10 bg-[#233648]">
              <img
                src={formData.avatar || '/Logo.jpg'}
                alt=""
                className="size-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = '/Logo.jpg';
                }}
              />
            </div>
            <h2 className="mt-4 text-content font-black text-xl break-words">{formData.name}</h2>
            <p className="text-[#92adc9] text-sm break-all">{formData.email}</p>
          </div>

          <div className="p-5 space-y-3">
            {goalOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal: option.value }))}
                className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors duration-200 ${
                  formData.goal === option.value
                    ? 'border-primary bg-primary/15 text-content'
                    : 'border-[#233648] text-[#92adc9] hover:border-primary/60 hover:bg-[#233648]/70'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-base">{option.icon}</span>
                  <span className="text-sm font-bold">{option.label}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-[#233648] bg-card-dark overflow-hidden">
            <div className="p-5 border-b border-[#233648] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-content font-bold text-lg">{t('account')}</h2>
                <p className="text-[#92adc9] text-sm">{isSpanish ? 'Datos visibles de tu perfil.' : 'Visible profile details.'}</p>
              </div>
              <span className="material-symbols-outlined text-primary">person</span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('displayName')}</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  maxLength={80}
                  className="bg-[#233648] border border-transparent rounded-lg text-content focus:border-primary focus:ring-primary h-12 px-4"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('emailAddress')}</span>
                <input
                  type="email"
                  name="email"
                  readOnly
                  value={formData.email}
                  className="bg-[#233648]/50 border border-transparent rounded-lg text-[#92adc9] h-12 px-4 cursor-not-allowed"
                />
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('avatarUrl')}</span>
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  maxLength={2048}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-[#233648] border border-transparent rounded-lg text-content focus:border-primary focus:ring-primary h-12 px-4"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-[#233648] bg-card-dark overflow-hidden">
            <div className="p-5 border-b border-[#233648] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-content font-bold text-lg">{t('preferences')}</h2>
                <p className="text-[#92adc9] text-sm">{isSpanish ? 'Idioma y experiencia principal.' : 'Language and primary experience.'}</p>
              </div>
              <span className="material-symbols-outlined text-accent-cyan">settings_accessibility</span>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('language')}</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, language: 'en' }))}
                    className={`cursor-pointer h-12 rounded-lg font-bold transition-colors border ${formData.language === 'en' ? 'bg-primary border-primary text-content' : 'border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, language: 'es' }))}
                    className={`cursor-pointer h-12 rounded-lg font-bold transition-colors border ${formData.language === 'es' ? 'bg-primary border-primary text-content' : 'border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}
                  >
                    Español
                  </button>
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('bioGoal')}</span>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  className="bg-[#233648] border border-transparent rounded-lg text-content focus:border-primary focus:ring-primary h-12 px-4"
                >
                  {goalOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#101922]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {(error || saved) && (
            <div className={`rounded-lg border px-4 py-3 text-sm font-bold ${error ? 'border-red-500/50 bg-red-500/10 text-red-300' : 'border-accent-teal/40 bg-accent-teal/10 text-accent-teal'}`}>
              {error || t('settingsUpdated')}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              className="cursor-pointer bg-primary hover:bg-primary/90 text-content px-6 h-12 rounded-lg font-bold transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              {t('saveChanges')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData(user);
                setError(null);
                setSaved(false);
              }}
              className="cursor-pointer border border-[#233648] hover:bg-[#233648] text-[#92adc9] px-6 h-12 rounded-lg font-bold transition-colors"
            >
              {isSpanish ? 'Restablecer' : 'Reset'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
