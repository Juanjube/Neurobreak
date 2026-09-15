
import React, { useState } from 'react';
import { User } from '../types';
import { signInWithPassword, signUp, signInWithGoogle } from '../services/supabase';
import { translations } from '../constants/translations';
import { firstValidationError, loginSchema, registrationSchema } from '../utils/validation';
import { DEFAULT_GOAL_ID, GOALS, GoalId } from '../constants/goals';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalId>(DEFAULT_GOAL_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const t = (key: keyof typeof translations['en']) => translations[language][key] || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(firstValidationError(parsed.error));

        const { error } = await signInWithPassword(parsed.data.email, parsed.data.password);
        if (error) throw error;
      } else {
        const parsed = registrationSchema.safeParse({
          name,
          email,
          password,
          goal,
        });
        if (!parsed.success) throw new Error(firstValidationError(parsed.error));

        const { data, error } = await signUp(
          parsed.data.email,
          parsed.data.password,
          parsed.data.name,
          parsed.data.goal
        );
        if (error) throw error;
        if (data.user && !data.session) {
          setInfoMessage('Registration successful! Please check your email to confirm your account.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  if (!isLogin) {
    return (
      <div className="min-h-[100dvh] bg-[#080B0E] text-content font-sans relative flex lg:flex-row flex-col">
        {/* Global Header */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 pointer-events-none">
          <div className="flex items-center gap-3">
            <img src="/Logo.jpg" alt="NeuroBreak Map" className="w-8 h-8 rounded shrink-0 object-cover" />
            <span className="font-bold tracking-tight">NeuroBreak</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-4 text-sm">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium transition-colors text-content/80 px-4 py-1.5"
                onClick={() => setIsLangOpen(!isLangOpen)}
              >
                <span className={`fi fi-${language === 'en' ? 'us' : 'es'}`}></span>
                {language.toUpperCase()}
                <span className="material-symbols-outlined text-[16px] ml-1">expand_more</span>
              </button>
              {isLangOpen && (
                <div className="absolute top-full mt-2 left-0 min-w-[100px] bg-border border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-white/5 transition-colors"
                    onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
                  >
                    <span className="fi fi-us text-lg"></span> EN
                  </button>
                  <button
                    className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-white/5 transition-colors"
                    onClick={() => { setLanguage('es'); setIsLangOpen(false); }}
                  >
                    <span className="fi fi-es text-lg"></span> ES
                  </button>
                </div>
              )}
            </div>
            <span className="text-content/60 hidden sm:inline">
              {language === 'en' ? 'Already have an account?' : '¿Ya tienes una cuenta?'}
            </span>
            <button
              onClick={() => {
                setIsLogin(true);
                setError(null);
                setInfoMessage(null);
              }}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors"
            >
              {language === 'en' ? 'Sign In' : 'Iniciar Sesión'}
            </button>
          </div>
        </div>

        {/* Left Branding Pane */}
        <div className="lg:w-1/2 p-6 lg:p-8 pt-24 lg:pt-8 flex flex-col justify-center">
          <div className="w-full max-w-lg mx-auto">
            <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-gradient-to-br from-[#E0F7FA]/90 via-[#80DEEA]/60 to-[#233648] p-8 flex flex-col justify-between shadow-2xl">
              <div className="self-start px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-full text-xs font-bold text-[#00E5FF] tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse"></span>
                {language === 'en' ? 'Live Sanctuary' : 'Santuario en Vivo'}
              </div>

              <div className="bg-border/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-auto">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF]">
                    <span className="material-symbols-outlined text-lg">psychology</span>
                  </div>
                  <h3 className="font-bold text-lg">
                    {language === 'en' ? 'Personalized Refuge' : 'Refugio Personalizado'}
                  </h3>
                </div>
                <p className="text-muted text-sm leading-relaxed">
                  {language === 'en'
                    ? 'Discover a workspace that adapts to your cognitive rhythms, ensuring peak flow and sustained well-being.'
                    : 'Descubre un espacio de trabajo que se adapta a tus ritmos cognitivos, asegurando un estado de flujo máximo y bienestar sostenido.'}
                </p>
              </div>
            </div>
            <div className="mt-8 px-4">
              <p className="text-muted text-xs font-bold tracking-widest uppercase mb-2">
                {language === 'en' ? 'The Neurobreak Philosophy' : 'La Filosofía Neurobreak'}
              </p>
              <p className="text-xl font-medium">
                {language === 'en' ? 'Work with intention, rest with purpose.' : 'Trabaja con intención, descansa con propósito.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="w-full max-w-md mx-auto relative z-10 pt-12 lg:pt-0">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <h1 className="text-4xl font-bold mb-3">{t('joinSanctuary')}</h1>
            <p className="text-muted mb-10">{t('yourGateway')}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-bold text-content/70 tracking-wider uppercase">{t('fullName')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    className="bg-transparent border border-border rounded-xl text-content placeholder:text-content/20 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] h-12 px-4 transition-colors"
                    placeholder={language === 'en' ? "Name" : "Nombre"}
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs font-bold text-content/70 tracking-wider uppercase">{t('email')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent border border-border rounded-xl text-content placeholder:text-content/20 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] h-12 px-4 transition-colors"
                    placeholder={language === 'en' ? "Email" : "Correo electrónico"}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-content/70 tracking-wider uppercase">{t('password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent border border-border rounded-xl text-content placeholder:text-content/20 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] h-12 px-4 w-full pr-12 transition-colors"
                    placeholder={language === 'en' ? "Password" : "Contraseña"}
                    minLength={8}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-content/40 hover:text-content transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-content/70 tracking-wider uppercase">{t('authGoal')}</label>
                <div className="relative">
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as GoalId)}
                    className="bg-transparent border border-border rounded-xl text-content focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] h-12 px-4 w-full appearance-none transition-colors"
                  >
                    {GOALS.map((option) => (
                      <option key={option.id} value={option.id} className="bg-[#080B0E]">{t(option.translationKey)}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-content/40">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00E5FF] hover:bg-[#00B8D4] text-[#080B0E] h-14 rounded-2xl font-bold transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : t('createAccount')}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#233648]"></div>
              </div>
              <div className="relative flex justify-center text-xs font-bold tracking-widest text-content/40 uppercase">
                <span className="px-4 bg-[#080B0E]">{t('orContinueWith')}</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white text-[#080B0E] h-12 rounded-xl font-bold transition-all hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="size-5" />
              {t('continueWithGoogle')}
            </button>

            <p className="text-content/40 text-xs text-center mt-8">
              {t('termsText')} <a href="#" className="text-content/60 hover:text-content underline decoration-white/30 underline-offset-2">Terms of Service</a> {language === 'en' ? 'and' : 'y'} <a href="#" className="text-content/60 hover:text-content underline decoration-white/30 underline-offset-2">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Login View (Unchanged from original)
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 overflow-y-auto relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10 w-auto">
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 bg-[#233648] hover:bg-border/80 border border-white/10 rounded-full font-medium transition-colors text-content/80 px-4 py-1.5 text-sm"
            onClick={() => setIsLangOpen(!isLangOpen)}
          >
            <span className={`fi fi-${language === 'en' ? 'us' : 'es'}`}></span>
            {language.toUpperCase()}
            <span className="material-symbols-outlined text-[16px] ml-1">expand_more</span>
          </button>
          {isLangOpen && (
            <div className="absolute top-full mt-2 right-0 min-w-[100px] bg-[#233648] border border-white/10 rounded-xl overflow-hidden shadow-xl z-50">
              <button
                className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-white/5 transition-colors text-sm"
                onClick={() => { setLanguage('en'); setIsLangOpen(false); }}
              >
                <span className="fi fi-us text-lg"></span> EN
              </button>
              <button
                className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-white/5 transition-colors text-sm"
                onClick={() => { setLanguage('es'); setIsLangOpen(false); }}
              >
                <span className="fi fi-es text-lg"></span> ES
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full max-w-sm bg-surface border border-white/10 p-6 rounded-2xl shadow-2xl my-auto shrink-0 mt-16 sm:mt-auto relative z-20">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src="/Logo.jpg" alt="NeuroBreak Logo" className="size-24 rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold tracking-tight">NeuroBreak AI</h1>
          <p className="text-[#92adc9] text-sm text-center">{t('optimizePerformance')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg text-sm mb-4 text-center">
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#92adc9] uppercase">{t('email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#233648] border-none rounded-xl text-content placeholder:text-content/20 focus:ring-primary"
              placeholder="neuro@science.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#92adc9] uppercase">{t('password')}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#233648] border-none rounded-xl text-content placeholder:text-content/20 focus:ring-primary w-full pr-10"
                placeholder="••••••••"
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#92adc9] hover:text-content"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-content h-11 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              t('signIn')
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#233648]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-[#92adc9]">{t('orContinueWith')}</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 text-content border border-[#233648] h-11 rounded-xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="size-5" />
          {t('continueWithGoogle')}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setInfoMessage(null);
            }}
            className="text-sm text-[#92adc9] hover:text-content transition-colors"
          >
            {t('dontHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
