
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Added missing 'progress' property to satisfy the User interface
    onLogin({
      name: name || 'Explorer',
      email: email || 'user@neurobreak.ai',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8tVVenH4DAYEjgMcmJ3MhTfeSY7hLzxL3LH8vuuMQcXlK6UWw67D4PK06KVu6pjEAOdnthAhxmEstZY1xrmqeuFWfh_7tetgkURLbkZu6DoXIxztVqPmcJAxhRwI2CEKff6Zo78mLCSp_-Gmuwb-Sl-1n8gtW_pIQYXEFUripk-Qm_KWVDkSIue0_1GWTKVZPjEfKpAx0D2_LrFM8Wn-oo5KybVeuzSGTiy_1ogWLP9_blRY-6HjV4R-KgPKDIC8bdQ31orxbiTnH',
      language: 'en',
      progress: {
        mentalClarity: 3.2,
        backHealth: 45,
        sessionsCompleted: 0
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark p-4">
      <div className="w-full max-w-md bg-card-dark border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="size-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">psychology</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">NeuroBreak AI</h1>
          <p className="text-[#92adc9] text-sm text-center">Optimize your brain's performance with data-driven bio-hacks.</p>
        </div>

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
            <input 
              type="password" 
              required
              className="bg-[#233648] border-none rounded-xl text-white placeholder:text-white/20 focus:ring-primary" 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 mt-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
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
