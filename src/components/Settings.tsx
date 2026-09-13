import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { requestPasswordReset } from '../services/supabase';

interface SettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => Promise<void> | void;
  t: (key: any) => string;
}

type SectionId = 'preferencias' | 'privacidad' | 'notificaciones' | 'seguridad' | 'acerca';
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
  language: user.language || 'es',
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
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', theme);
};

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, t }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('preferencias');
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      return {
        ...getDefaults(user),
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
        language: user.language || 'es',
      };
    } catch {
      return getDefaults(user);
    }
  });

  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings((current) => ({ ...current, language: user.language || 'es' }));
  }, [user.language]);

  const isSpanish = settings.language === 'es';
  const copy = (es: string, en: string) => (isSpanish ? es : en);

  const saveLocal = (next: SettingsState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveLocal(next);
      return next;
    });

    if (key === 'theme') {
      applyTheme(value as Theme);
    }

    setNotice(copy('Preferencia guardada en este dispositivo.', 'Preference saved on this device.'));
    setError(null);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSetting('theme', nextTheme);
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

  const handleClearBioLog = () => {
    if (window.confirm(copy('¿Estás seguro de que deseas eliminar el historial Bio-Log local?', 'Are you sure you want to clear local Bio-Log history?'))) {
      try {
        localStorage.removeItem('neurobreak-wellness-metrics');
        localStorage.removeItem('neurobreak-daily-streak');
        setNotice(copy('Historial Bio-Log reiniciado correctamente.', 'Bio-Log history reset successfully.'));
      } catch {
        setError(copy('No se pudo eliminar el historial.', 'Could not delete history.'));
      }
    }
  };

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems: { id: SectionId; icon: string; es: string; en: string }[] = [
    { id: 'preferencias', icon: 'tune', es: 'Preferencias', en: 'Preferences' },
    { id: 'privacidad', icon: 'security', es: 'Privacidad', en: 'Privacy' },
    { id: 'notificaciones', icon: 'notifications_active', es: 'Notificaciones', en: 'Notifications' },
    { id: 'seguridad', icon: 'lock', es: 'Seguridad', en: 'Security' },
    { id: 'acerca', icon: 'info', es: 'Acerca de', en: 'About' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Toast Notice / Error */}
      {(notice || error) && (
        <div
          className={`mb-6 flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
            error
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-primary/40 bg-primary/10 text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">
              {error ? 'error' : 'check_circle'}
            </span>
            <span>{error || notice}</span>
          </div>
          <button
            onClick={() => { setNotice(null); setError(null); }}
            className="text-muted hover:text-content text-sm"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-24 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-5 shadow-sm">
          <div className="mb-6 px-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('settings')}
            </h2>
            <p className="mt-1 text-[11px] font-medium text-muted uppercase tracking-wider">
              {copy('Protocolo de Optimización', 'Optimization Protocol')}
            </p>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`flex shrink-0 items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all text-left ${
                    isActive
                      ? 'bg-primary/15 text-primary border-l-4 border-primary shadow-sm'
                      : 'text-muted hover:bg-surface hover:text-content'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  <span>{isSpanish ? item.es : item.en}</span>
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:block mt-8 pt-6 border-t border-border/60">
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">auto_awesome</span>
              <div>
                <p className="text-xs font-bold text-content">Kinetic Pro</p>
                <p className="text-[10px] text-muted font-medium">{copy('Protocolo Activo', 'Active Protocol')}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Bento Grid Area */}
        <main className="flex-1 w-full min-w-0">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-content tracking-tight mb-2">
              {copy('Configuración General', 'General Settings')}
            </h1>
            <p className="text-sm md:text-base text-muted max-w-2xl leading-relaxed">
              {copy(
                'Ajusta los parámetros de tu entorno cognitivo y sincronización biológica para un rendimiento óptimo.',
                'Adjust the parameters of your cognitive environment and biological synchronization for optimal performance.'
              )}
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Preferencias del Sistema (2/3 Width) */}
            <section
              id="preferencias"
              className="md:col-span-2 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-primary/40 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">tune</span>
                  <h3 className="text-xl font-bold text-content">
                    {copy('Preferencias del Sistema', 'System Preferences')}
                  </h3>
                </div>

                {/* Direct Theme Toggle Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-surface hover:border-primary transition-all text-content shadow-sm active:scale-95"
                  title={copy('Alternar Modo Oscuro / Claro', 'Toggle Dark / Light Mode')}
                >
                  <span className="material-symbols-outlined text-base text-primary">
                    {settings.theme === 'dark' ? 'dark_mode' : 'light_mode'}
                  </span>
                  <span>{settings.theme === 'dark' ? copy('Modo Oscuro', 'Dark Mode') : copy('Modo Claro', 'Light Mode')}</span>
                </button>
              </div>

              <div className="space-y-6">
                {/* Theme Selection Buttons */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3 block">
                    {copy('Interfaz de Usuario', 'User Interface')}
                  </label>
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => updateSetting('theme', 'dark')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        settings.theme === 'dark'
                          ? 'border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(157,78,221,0.25)] font-bold'
                          : 'border-border/70 bg-surface/50 text-muted hover:border-primary/50 hover:text-content'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-primary">dark_mode</span>
                      <span className="text-sm font-medium">{copy('Oscuro', 'Dark')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('theme', 'light')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        settings.theme === 'light'
                          ? 'border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(157,78,221,0.25)] font-bold'
                          : 'border-border/70 bg-surface/50 text-muted hover:border-primary/50 hover:text-content'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-muted">light_mode</span>
                      <span className="text-sm font-medium">{copy('Claro', 'Light')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSetting('theme', 'system')}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                        settings.theme === 'system'
                          ? 'border-primary bg-primary/15 text-primary shadow-[0_0_15px_rgba(157,78,221,0.25)] font-bold'
                          : 'border-border/70 bg-surface/50 text-muted hover:border-primary/50 hover:text-content'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl text-muted">settings_suggest</span>
                      <span className="text-sm font-medium">{copy('Adaptativo', 'Adaptive')}</span>
                    </button>
                  </div>
                </div>

                {/* Language & Timezone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 block">
                      {copy('Idioma de Interfaz', 'Interface Language')}
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => updateSetting('language', e.target.value as 'es' | 'en')}
                      className="w-full h-11 bg-surface border border-border/80 rounded-xl px-4 text-sm font-medium text-content focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="es">Español (Castellano)</option>
                      <option value="en">English (Global)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 block">
                      {copy('Zona Horaria', 'Time Zone')}
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="w-full h-11 bg-surface border border-border/80 rounded-xl px-4 text-sm font-medium text-content focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                    >
                      <option value="America/Bogota">(GMT-05:00) Bogotá / Lima</option>
                      <option value="America/Mexico_City">(GMT-06:00) Ciudad de México</option>
                      <option value="America/New_York">(GMT-05:00) New York / Eastern</option>
                      <option value="Europe/Madrid">(GMT+01:00) Madrid / Paris</option>
                      <option value="Europe/London">(GMT+00:00) London / UTC</option>
                      <option value="Asia/Tokyo">(GMT+09:00) Tokyo / Zen</option>
                    </select>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={saveAccountPreferences}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-content transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait shadow-md"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    <span>{saving ? copy('Guardando...', 'Saving...') : copy('Guardar Cambios', 'Save Changes')}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2. Privacidad y Datos (1/3 Width) */}
            <section
              id="privacidad"
              className="md:col-span-1 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-primary/40 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  <span className="material-symbols-outlined text-primary text-2xl">security</span>
                  <h3 className="text-xl font-bold text-content">
                    {copy('Privacidad', 'Privacy')}
                  </h3>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-content">
                        {copy('Sincronización Biométrica', 'Biometric Synchronization')}
                      </p>
                      <p className="text-xs text-muted">
                        {copy('Enlace con neuro-sensores externos', 'Link with external neuro-sensors')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.biometricSync}
                      onChange={(val) => updateSetting('biometricSync', val)}
                    />
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-content">
                        {copy('Anonimización', 'Anonymization')}
                      </p>
                      <p className="text-xs text-muted">
                        {copy('Protección de datos de laboratorio', 'Lab data protection and privacy')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.anonymousAnalytics}
                      onChange={(val) => updateSetting('anonymousAnalytics', val)}
                    />
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="text-sm font-bold text-content">
                        {copy('Cloud Backup', 'Cloud Backup')}
                      </p>
                      <p className="text-xs text-muted">
                        {copy('Respaldo encriptado de perfiles', 'Encrypted profile backup')}
                      </p>
                    </div>
                    <Switch
                      checked={settings.cloudBackup}
                      onChange={(val) => updateSetting('cloudBackup', val)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <button
                  type="button"
                  onClick={handleClearBioLog}
                  className="w-full py-3 px-4 border border-red-500/40 text-red-400 font-bold text-xs rounded-xl hover:bg-red-500/10 transition-colors text-center"
                >
                  {copy('Eliminar Historial Bio-Log', 'Delete Bio-Log History')}
                </button>
              </div>
            </section>

            {/* 3. Notificaciones - Sistema de Alertas Cognitivas (2/3 Width) */}
            <section
              id="notificaciones"
              className="md:col-span-2 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-primary/40 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <span className="material-symbols-outlined text-primary text-2xl">notifications_active</span>
                <h3 className="text-xl font-bold text-content">
                  {copy('Sistema de Alertas Cognitivas', 'Cognitive Alert System')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Rituals */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-surface/50 hover:bg-surface/80 transition-all">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                    <span className="material-symbols-outlined">wb_sunny</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-content truncate">
                        {copy('Rituales Matutinos', 'Morning Rituals')}
                      </p>
                      <Switch
                        checked={settings.ritualAlerts}
                        onChange={(val) => updateSetting('ritualAlerts', val)}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {copy('Guía de optimización tras el despertar y pausas.', 'Optimization guide upon waking and break rituals.')}
                    </p>
                  </div>
                </div>

                {/* Cognitive Fatigue */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-surface/50 hover:bg-surface/80 transition-all">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                    <span className="material-symbols-outlined">psychology</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-content truncate">
                        {copy('Fatiga Cognitiva', 'Cognitive Fatigue')}
                      </p>
                      <Switch
                        checked={settings.fatigueAlerts}
                        onChange={(val) => updateSetting('fatigueAlerts', val)}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {copy('Aviso preventivo ante descenso de enfoque.', 'Preventive alert when focus drops.')}
                    </p>
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-surface/50 hover:bg-surface/80 transition-all">
                  <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-content truncate">
                        {copy('Progreso Semanal', 'Weekly Progress')}
                      </p>
                      <Switch
                        checked={settings.weeklyReport}
                        onChange={(val) => updateSetting('weeklyReport', val)}
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {copy('Reporte detallado de métricas neuronales.', 'Detailed report of neural metrics.')}
                    </p>
                  </div>
                </div>

                {/* Kinetic Proximity (Periférico) */}
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-surface/30 opacity-60 transition-all">
                  <div className="p-3 bg-surface rounded-xl text-muted shrink-0">
                    <span className="material-symbols-outlined">distance</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-bold text-content truncate">
                        {copy('Proximidad Kinetic', 'Kinetic Proximity')}
                      </p>
                      <Switch
                        checked={settings.sessionReminder}
                        onChange={(val) => updateSetting('sessionReminder', val)}
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {copy('Requiere hardware periférico v4.0.', 'Requires peripheral hardware v4.0.')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Seguridad (1/3 Width) */}
            <section
              id="seguridad"
              className="md:col-span-1 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-primary/40 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                  <span className="material-symbols-outlined text-primary text-2xl">lock</span>
                  <h3 className="text-xl font-bold text-content">
                    {copy('Seguridad', 'Security')}
                  </h3>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-border hover:border-primary/60 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-muted group-hover:text-primary transition-colors">
                        password
                      </span>
                      <span className="text-sm font-bold text-content">
                        {copy('Cambiar Contraseña', 'Change Password')}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-muted text-lg group-hover:translate-x-0.5 transition-transform">
                      chevron_right
                    </span>
                  </button>

                  <div className="w-full flex items-center justify-between p-3.5 rounded-xl bg-surface/60 border border-border text-left">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">
                        verified_user
                      </span>
                      <div>
                        <span className="text-sm font-bold text-content block">
                          {copy('Autenticación 2FA', '2FA Authentication')}
                        </span>
                        <span className="text-[10px] text-primary font-bold tracking-wider uppercase">
                          {copy('ACTIVADO', 'ENABLED')}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-muted text-lg">
                      check_circle
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">shield</span>
                  <span>
                    {copy(
                      'Tu sesión está protegida con encriptación cuántica y los protocolos de Supabase Auth.',
                      'Your session is protected with quantum encryption and Supabase Auth protocols.'
                    )}
                  </span>
                </p>
              </div>
            </section>

            {/* 5. Acerca de (Bento Footer Row - Full Width) */}
            <section
              id="acerca"
              className="md:col-span-3 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl p-6 md:p-8 transition-all hover:border-primary/40 shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                    <span className="material-symbols-outlined text-primary text-3xl">neurology</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-content">
                      NeuroBreak Kinetic v2.4.1
                    </h4>
                    <p className="text-xs text-muted font-medium">
                      Nucleus Engine Build: 2026.09-STABLE
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs font-bold">
                  <a
                    href="#acerca"
                    onClick={(e) => { e.preventDefault(); setNotice(copy('Términos de servicio actualizados.', 'Terms of service updated.')); }}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    {copy('Términos de Servicio', 'Terms of Service')}
                  </a>
                  <a
                    href="#acerca"
                    onClick={(e) => { e.preventDefault(); setNotice(copy('Política de Bio-Ética de NeuroBreak en conformidad.', 'NeuroBreak Bio-Ethics Policy in compliance.')); }}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    {copy('Política de Bio-Ética', 'Bio-Ethics Policy')}
                  </a>
                  <a
                    href="#acerca"
                    onClick={(e) => { e.preventDefault(); setNotice(copy('Documentación de la API disponible para desarrolladores.', 'API Documentation available for developers.')); }}
                    className="text-muted hover:text-primary transition-colors"
                  >
                    {copy('Documentación API', 'API Documentation')}
                  </a>
                  <a
                    href="#acerca"
                    onClick={(e) => { e.preventDefault(); setNotice(copy('Roadmap 2026: Sincronización con EEG y bio-feedback en camino.', 'Roadmap 2026: EEG synchronization and bio-feedback on track.')); }}
                    className="px-5 py-2 bg-primary text-content font-bold rounded-full shadow-[0_0_15px_rgba(157,78,221,0.25)] hover:scale-105 transition-all text-xs"
                  >
                    {copy('Ver Roadmap', 'View Roadmap')}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

/* Micro-Component: Accessible Animated Switch */
const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
      disabled ? 'cursor-not-allowed opacity-40' : ''
    } ${
      checked
        ? 'bg-primary shadow-[0_0_12px_rgba(157,78,221,0.4)]'
        : 'bg-muted/30 dark:bg-white/10'
    }`}
  >
    <span
      className={`inline-block size-4 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default Settings;
