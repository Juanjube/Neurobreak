
import React, { useState } from 'react';
import { User } from '../types';
import { signInWithPassword, signUp, signInWithGoogle } from '../services/supabase';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await signInWithPassword(email, password);
        if (error) throw error;
        // Navigation will be handled by App.tsx listening to auth state
      } else {
        const { data, error } = await signUp(email, password, name);
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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background-dark p-4 overflow-y-auto">
      <div className="w-full max-w-sm bg-card-dark border border-white/10 p-6 rounded-2xl shadow-2xl my-auto shrink-0">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src="/Logo.jpg" alt="NeuroBreak Logo" className="size-24 rounded-2xl object-cover" />
          <h1 className="text-2xl font-bold tracking-tight">NeuroBreak AI</h1>
          <p className="text-[#92adc9] text-sm text-center">Optimize your brain's performance with data-driven bio-hacks.</p>
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
          {!isLogin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#92adc9] uppercase">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#233648] border-none rounded-xl text-white placeholder:text-white/20 focus:ring-primary"
                placeholder="Dr. Andrew Huberman"
                required={!isLogin}
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#92adc9] uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#233648] border-none rounded-xl text-white placeholder:text-white/20 focus:ring-primary"
              placeholder="neuro@science.com"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#92adc9] uppercase">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#233648] border-none rounded-xl text-white placeholder:text-white/20 focus:ring-primary w-full pr-10"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#92adc9] hover:text-white"
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
            className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#233648]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card-dark text-[#92adc9]">Or continue with</span>
          </div>
        </div>

        <button
          onClick={async () => {
            setLoading(true);
            await signInWithGoogle();
            setLoading(false);
          }}
          disabled={loading}
          className="w-full bg-white/5 hover:bg-white/10 text-white border border-[#233648] h-11 rounded-xl font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="size-5" />
          Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setInfoMessage(null);
            }}
            className="text-sm text-[#92adc9] hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
