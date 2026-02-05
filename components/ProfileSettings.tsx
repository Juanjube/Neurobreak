
import React, { useState } from 'react';
import { User, Language } from '../types';

interface ProfileSettingsProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  t: (key: any) => string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateUser, t }) => {
  const [formData, setFormData] = useState<User>(user);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-white text-4xl font-black leading-tight tracking-tight">{t('settings')}</h1>
        <p className="text-[#92adc9] text-base">{t('profile')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-card-dark rounded-2xl border border-[#233648] overflow-hidden">
          <div className="p-6 border-b border-[#233648] flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">person</span>
            <h2 className="text-white font-bold text-xl">{t('account')}</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('displayName')}</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-[#233648] border-none rounded-xl text-white focus:ring-primary h-12 px-4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('emailAddress')}</label>
              <input 
                type="email" 
                name="email"
                readOnly
                value={formData.email}
                className="bg-[#233648]/50 border-none rounded-xl text-[#92adc9] h-12 px-4 cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('bioGoal')}</label>
              <select 
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                className="bg-[#233648] border-none rounded-xl text-white focus:ring-primary h-12 px-4"
              >
                <option value="Deep Work">Deep Work Optimization</option>
                <option value="Creative Flow">Creative Flow State</option>
                <option value="Back Health">Spinal & Postural Recovery</option>
                <option value="Stress Management">Vagus Nerve Regulation</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-card-dark rounded-2xl border border-[#233648] overflow-hidden">
          <div className="p-6 border-b border-[#233648] flex items-center gap-4">
            <span className="material-symbols-outlined text-accent-cyan">tune</span>
            <h2 className="text-white font-bold text-xl">{t('preferences')}</h2>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#92adc9] uppercase tracking-wider">{t('language')}</label>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, language: 'en' }))}
                  className={`flex-1 h-12 rounded-xl font-bold transition-all border ${formData.language === 'en' ? 'bg-primary border-primary text-white' : 'border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}
                >
                  English (EN)
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, language: 'es' }))}
                  className={`flex-1 h-12 rounded-xl font-bold transition-all border ${formData.language === 'es' ? 'bg-primary border-primary text-white' : 'border-[#233648] text-[#92adc9] hover:bg-[#233648]'}`}
                >
                  Español (ES)
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-white px-8 h-12 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            {t('saveChanges')}
          </button>
          {saved && (
            <span className="text-accent-teal font-bold animate-pulse text-sm">
              Settings updated successfully!
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
