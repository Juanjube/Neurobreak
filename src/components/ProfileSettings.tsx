import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { requestPasswordReset } from '../services/supabase';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
  t: (key: any) => string;
}

type Section = 'preferences' | 'privacy' | 'notifications' | 'security' | 'about';
type Theme = 'dark' | 'light' | 'system';

interface SettingsState {
  theme: Theme;
  language: 'en' | 'es';
  timezone: string;
  biometricSync: boolean;
  anonymousAnalytics: boolean;
  cloudBackup: boolean;
  ritualAlerts: boolean;
  fatigueAlerts: boolean;
  weeklyReport: boolean;
  sessionReminder: boolean;
}

const STORAGE_KEY = 'neurobreak-settings';

const getDefaults = (user: User): SettingsState => ({
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  language: user.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Bogota',
  biometricSync: true,
  anonymousAnalytics: true,
  cloudBackup: false,
  ritualAlerts: true,
  fatigueAlerts: true,
  weeklyReport: true,
  sessionReminder: false,
});

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));
  localStorage.setItem('theme', theme);
};

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser, t }) => {
  const [section, setSection] = useState<Section>('preferences');
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      return { ...getDefaults(user), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'), language: user.language };
    } catch {
      return getDefaults(user);
    }
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings((current) => ({ ...current, language: user.language }));
  }, [user.language]);

  const isSpanish = settings.language === 'es';
  const copy = (es: string, en: string) => isSpanish ? es : en;
  const saveLocal = (next: SettingsState) => localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveLocal(next);
      return next;
    });
    if (key === 'theme') applyTheme(value as Theme);
    setNotice(copy('Preferencia guardada en este dispositivo.', 'Preference saved on this device.'));
    setError(null);
  };

  const saveAccountPreferences = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdateUser({ ...user, language: settings.language });
      saveLocal(settings);
      setNotice(copy('Configuración guardada correctamente.', 'Settings saved successfully.'));
    } catch (err: any) {
      setError(err?.message || copy('No se pudo guardar la configuración.', 'Could not save settings.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    try {
      const { error: resetError } = await requestPasswordReset(user.email);
      if (resetError) throw resetError;
      setNotice(copy('Te enviamos un correo para restablecer tu contraseña.', 'We sent you an email to reset your password.'));
    } catch (err: any) {
      setError(err?.message || copy('No se pudo enviar el correo.', 'Could not send the email.'));
    }
  };

  const navItems: { id: Section; icon: string; es: string; en: string }[] = [
    { id: 'preferences', icon: 'tune', es: 'Preferencias', en: 'Preferences' },
    { id: 'privacy', icon: 'shield', es: 'Privacidad', en: 'Privacy' },
    { id: 'notifications', icon: 'notifications', es: 'Notificaciones', en: 'Notifications' },
    { id: 'security', icon: 'lock', es: 'Seguridad', en: 'Security' },
    { id: 'about', icon: 'info', es: 'Acerca de', en: 'About' },
  ];

  const sectionTitle = navItems.find((item) => item.id === section);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/10 lg:grid lg:grid-cols-[230px_1fr]">
        <aside className="border-b border-border bg-background/50 lg:min-h-[680px] lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{t('settings')}</p>
            <p className="mt-1 text-xs text-muted">{copy('Protocolo de optimización', 'Optimization protocol')}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => { setSection(item.id); setNotice(null); setError(null); }} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${section === item.id ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-primary/10 hover:text-content'}`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                {isSpanish ? item.es : item.en}
              </button>
            ))}
          </nav>
          <div className="hidden border-t border-border p-4 lg:block">
            <div className="rounded-xl bg-primary/10 p-3 text-xs text-muted"><span className="material-symbols-outlined mr-1 align-bottom text-base text-primary">sync</span>{copy('Los ajustes se sincronizan con tu cuenta cuando aplica.', 'Account settings sync when applicable.')}</div>
          </div>
        </aside>

        <main className="min-w-0 p-5 md:p-8">
          <header className="mb-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary"><span className="material-symbols-outlined text-base">settings</span>{sectionTitle && (isSpanish ? sectionTitle.es : sectionTitle.en)}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-content">{section === 'preferences' ? copy('Configuración general', 'General settings') : isSpanish ? sectionTitle?.es : sectionTitle?.en}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">{section === 'preferences' ? copy('Personaliza tu entorno NeuroBreak y la forma en la que se presenta.', 'Customize your NeuroBreak environment and how it appears.') : copy('Gestiona las preferencias de tu experiencia y de tus datos.', 'Manage preferences for your experience and data.')}</p>
          </header>

          {section === 'preferences' && <Preferences settings={settings} updateSetting={updateSetting} copy={copy} onSave={saveAccountPreferences} saving={saving} />}
          {section === 'privacy' && <Privacy settings={settings} updateSetting={updateSetting} copy={copy} />}
          {section === 'notifications' && <Notifications settings={settings} updateSetting={updateSetting} copy={copy} />}
          {section === 'security' && <Security user={user} copy={copy} onResetPassword={handlePasswordReset} />}
          {section === 'about' && <About copy={copy} />}

          {(notice || error) && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm font-medium ${error ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-accent-teal/30 bg-accent-teal/10 text-accent-teal'}`}>{error || notice}</div>}
        </main>
      </div>
    </div>
  );
};

const Preferences: React.FC<{ settings: SettingsState; updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void; copy: (es: string, en: string) => string; onSave: () => Promise<void>; saving: boolean }> = ({ settings, updateSetting, copy, onSave, saving }) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.8fr]">
    <section className="rounded-2xl border border-border bg-background/40 p-5 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-black text-content"><span className="material-symbols-outlined text-primary">tune</span>{copy('Preferencias del sistema', 'System preferences')}</h2>
      <p className="mt-1 text-xs text-muted">{copy('Elige cómo se ve y se adapta la aplicación.', 'Choose how the application looks and adapts.')}</p>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-wider text-muted">{copy('Tema de interfaz', 'Interface theme')}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ThemeButton active={settings.theme === 'dark'} icon="dark_mode" label={copy('Oscuro', 'Dark')} onClick={() => updateSetting('theme', 'dark')} />
        <ThemeButton active={settings.theme === 'light'} icon="light_mode" label={copy('Claro', 'Light')} onClick={() => updateSetting('theme', 'light')} />
        <ThemeButton active={settings.theme === 'system'} icon="brightness_auto" label={copy('Automático', 'Automatic')} onClick={() => updateSetting('theme', 'system')} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField label={copy('Idioma de interfaz', 'Interface language')} value={settings.language} onChange={(value) => updateSetting('language', value as 'es' | 'en')} options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
        <SelectField label={copy('Zona horaria', 'Time zone')} value={settings.timezone} onChange={(value) => updateSetting('timezone', value)} options={[{ value: 'America/Bogota', label: 'GMT-05:00 Bogotá' }, { value: 'America/Mexico_City', label: 'GMT-06:00 Ciudad de México' }, { value: 'America/New_York', label: 'GMT-05:00 New York' }, { value: 'Europe/Madrid', label: 'GMT+01:00 Madrid' }]} />
      </div>
      <button onClick={onSave} disabled={saving} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-content transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"><span className="material-symbols-outlined text-lg">save</span>{saving ? copy('Guardando…', 'Saving…') : copy('Guardar cambios', 'Save changes')}</button>
    </section>
    <section className="rounded-2xl border border-border bg-background/40 p-5 md:p-6"><h2 className="flex items-center gap-2 text-lg font-black text-content"><span className="material-symbols-outlined text-primary">account_circle</span>{copy('Tu cuenta', 'Your account')}</h2><div className="mt-5 space-y-4"><InfoRow icon="person" label={copy('Nombre', 'Name')} value="Se edita desde Perfil" /><InfoRow icon="mail" label="Email" value="Protegido por tu cuenta" /><InfoRow icon="psychology" label={copy('Objetivo', 'Goal')} value={copy('Gestionado desde Perfil', 'Managed from Profile')} /></div></section>
  </div>
);

const Privacy: React.FC<{ settings: SettingsState; updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void; copy: (es: string, en: string) => string }> = ({ settings, updateSetting, copy }) => <section className="max-w-3xl rounded-2xl border border-border bg-background/40 p-5 md:p-6"><h2 className="flex items-center gap-2 text-lg font-black text-content"><span className="material-symbols-outlined text-primary">shield</span>{copy('Privacidad de datos', 'Data privacy')}</h2><p className="mt-1 text-sm text-muted">{copy('Controla cómo NeuroBreak usa tus preferencias y datos de actividad.', 'Control how NeuroBreak uses your preferences and activity data.')}</p><div className="mt-6 divide-y divide-border"><ToggleRow title={copy('Sincronización de bienestar', 'Wellness synchronization')} description={copy('Conserva el progreso de tus sesiones en tu cuenta.', 'Keep your session progress in your account.')} checked={settings.biometricSync} onChange={(checked) => updateSetting('biometricSync', checked)} /><ToggleRow title={copy('Analítica anónima', 'Anonymous analytics')} description={copy('Ayuda a mejorar la experiencia sin identificarte.', 'Help improve the experience without identifying you.')} checked={settings.anonymousAnalytics} onChange={(checked) => updateSetting('anonymousAnalytics', checked)} /><ToggleRow title={copy('Respaldo local', 'Local backup')} description={copy('Mantiene una copia de estas preferencias en este navegador.', 'Keep a copy of these preferences in this browser.')} checked={settings.cloudBackup} onChange={(checked) => updateSetting('cloudBackup', checked)} /></div></section>;

const Notifications: React.FC<{ settings: SettingsState; updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void; copy: (es: string, en: string) => string }> = ({ settings, updateSetting, copy }) => <section className="max-w-3xl rounded-2xl border border-border bg-background/40 p-5 md:p-6"><h2 className="flex items-center gap-2 text-lg font-black text-content"><span className="material-symbols-outlined text-primary">notifications_active</span>{copy('Alertas cognitivas', 'Cognitive alerts')}</h2><p className="mt-1 text-sm text-muted">{copy('Elige las alertas que quieres ver durante tu uso.', 'Choose the alerts you want to see while using the app.')}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><NotificationCard icon="self_improvement" title={copy('Rituales saludables', 'Healthy rituals')} description={copy('Pausas recomendadas durante el día.', 'Recommended breaks during the day.')} checked={settings.ritualAlerts} onChange={(checked) => updateSetting('ritualAlerts', checked)} /><NotificationCard icon="psychology" title={copy('Fatiga cognitiva', 'Cognitive fatigue')} description={copy('Avisos según tu actividad reciente.', 'Alerts based on recent activity.')} checked={settings.fatigueAlerts} onChange={(checked) => updateSetting('fatigueAlerts', checked)} /><NotificationCard icon="summarize" title={copy('Resumen semanal', 'Weekly summary')} description={copy('Tu avance y tendencias de la semana.', 'Your weekly progress and trends.')} checked={settings.weeklyReport} onChange={(checked) => updateSetting('weeklyReport', checked)} /><NotificationCard icon="alarm" title={copy('Recordatorio de sesión', 'Session reminder')} description={copy('Una invitación a iniciar una pausa activa.', 'A prompt to start an active break.')} checked={settings.sessionReminder} onChange={(checked) => updateSetting('sessionReminder', checked)} /></div></section>;

const Security: React.FC<{ user: User; copy: (es: string, en: string) => string; onResetPassword: () => Promise<void> }> = ({ user, copy, onResetPassword }) => <section className="max-w-3xl rounded-2xl border border-border bg-background/40 p-5 md:p-6"><h2 className="flex items-center gap-2 text-lg font-black text-content"><span className="material-symbols-outlined text-primary">lock</span>{copy('Seguridad de la cuenta', 'Account security')}</h2><p className="mt-1 text-sm text-muted">{copy('Protege el acceso a tu cuenta de NeuroBreak.', 'Protect access to your NeuroBreak account.')}</p><div className="mt-6 space-y-3"><ActionRow icon="password" title={copy('Cambiar contraseña', 'Change password')} description={copy('Te enviaremos un enlace seguro a', 'We will send a secure link to') + ` ${user.email}`} action={copy('Enviar enlace', 'Send link')} onClick={onResetPassword} /><ActionRow icon="verified_user" title={copy('Inicio de sesión protegido', 'Protected sign-in')} description={copy('Tu cuenta se autentica con los mecanismos seguros de Supabase.', 'Your account authenticates through Supabase security mechanisms.')} action={copy('Protegido', 'Protected')} /><ActionRow icon="devices" title={copy('Dispositivo actual', 'Current device')} description={copy('Gestiona las sesiones desde el proveedor de inicio de sesión.', 'Manage sessions from your sign-in provider.')} action={copy('Información', 'Info')} /></div></section>;

const About: React.FC<{ copy: (es: string, en: string) => string }> = ({ copy }) => <section className="max-w-3xl rounded-2xl border border-border bg-background/40 p-5 md:p-6"><span className="material-symbols-outlined text-4xl text-primary">neurology</span><h2 className="mt-3 text-xl font-black text-content">NeuroBreak</h2><p className="mt-1 text-sm text-muted">{copy('Herramientas para pausas activas, bienestar físico y foco cognitivo.', 'Tools for active breaks, physical wellbeing, and cognitive focus.')}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><InfoRow icon="new_releases" label={copy('Versión', 'Version')} value="0.0.0" /><InfoRow icon="language" label={copy('Idioma', 'Language')} value={copy('Disponible en español e inglés', 'Available in Spanish and English')} /></div></section>;

const ThemeButton: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void }> = ({ active, icon, label, onClick }) => <button onClick={onClick} className={`rounded-xl border p-4 text-center transition-colors ${active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-surface text-muted hover:border-primary/60 hover:text-content'}`}><span className="material-symbols-outlined text-xl">{icon}</span><span className="mt-2 block text-xs font-bold">{label}</span></button>;
const SelectField: React.FC<{ label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }> = ({ label, value, options, onChange }) => <label className="flex flex-col gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-content focus:border-primary focus:ring-primary">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-border'}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>;
const ToggleRow: React.FC<{ title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ title, description, checked, onChange }) => <div className="flex items-center justify-between gap-5 py-5 first:pt-0"><div><h3 className="font-bold text-content">{title}</h3><p className="mt-1 text-xs text-muted">{description}</p></div><Switch checked={checked} onChange={onChange} /></div>;
const NotificationCard: React.FC<{ icon: string; title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ icon, title, description, checked, onChange }) => <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-start justify-between gap-3"><span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">{icon}</span><Switch checked={checked} onChange={onChange} /></div><h3 className="mt-4 font-bold text-content">{title}</h3><p className="mt-1 text-xs leading-relaxed text-muted">{description}</p></div>;
const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"><span className="material-symbols-outlined text-primary">{icon}</span><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p><p className="text-xs font-medium text-content">{value}</p></div></div>;
const ActionRow: React.FC<{ icon: string; title: string; description: string; action: string; onClick?: () => void }> = ({ icon, title, description, action, onClick }) => <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="material-symbols-outlined text-primary">{icon}</span><div><h3 className="font-bold text-content">{title}</h3><p className="mt-1 text-xs text-muted">{description}</p></div></div><button onClick={onClick} disabled={!onClick} className="inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/40 px-3 py-2 text-xs font-bold text-primary enabled:hover:bg-primary enabled:hover:text-content disabled:cursor-default disabled:opacity-70">{action}</button></div>;

export default ProfileSettings;
