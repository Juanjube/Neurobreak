
import React, { useState, useEffect } from 'react';
import { Page, User } from '../types';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  currentPage: Page;
  t: (key: any) => string;
  onToggleMenu: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage, t, onToggleMenu }) => {
  // showMenu controla la visibilidad del menú desplegable del perfil de usuario (el que muestra "Settings" y "Logout")
  const [showMenu, setShowMenu] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
     const storedTheme = localStorage.getItem('theme');
     if (storedTheme) {
       const isStoredDark = storedTheme === 'dark';
       setIsDark(isStoredDark);
       if (isStoredDark) document.documentElement.classList.add('dark');
       else document.documentElement.classList.remove('dark');
     }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border px-4 md:px-10 py-3 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 md:gap-8">
        <button
          onClick={onToggleMenu}
          className="md:hidden text-muted hover:text-content"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div
          className="flex items-center gap-3 text-primary cursor-pointer"
          onClick={() => onNavigate(Page.DASHBOARD)}
        >
          <img src="/Logo.jpg" alt="Logo" className="size-10 rounded-full object-cover" />
          <h2 className="text-content text-xl font-bold leading-tight tracking-tight">NeuroBreak</h2>
        </div>
        <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-black/5 dark:bg-white/5">
            <div className="text-muted flex items-center justify-center pl-4">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent text-content focus:ring-0 placeholder:text-muted px-4 pl-2 text-sm"
              placeholder={t('searchPlaceholder')}
            />
          </div>
        </label>
      </div>

      <div className="flex flex-1 justify-end gap-8 items-center">
        <nav className="hidden lg:flex items-center gap-8">
          <button
            onClick={() => onNavigate(Page.DASHBOARD)}
            className={`${currentPage === Page.DASHBOARD ? 'text-primary' : 'text-muted'} hover:text-content transition-colors text-sm font-semibold leading-normal`}
          >
            {t('dashboard')}
          </button>

          <button
            onClick={() => onNavigate(Page.INSIGHTS)}
            className={`${currentPage === Page.INSIGHTS ? 'text-primary' : 'text-muted'} hover:text-content transition-colors text-sm font-medium leading-normal`}
          >
            {t('cognitiveLab')}
          </button>

          <button
            onClick={() => onNavigate(Page.MOVEMENT_ENGINE)}
            className={`${currentPage === Page.MOVEMENT_ENGINE ? 'text-primary' : 'text-muted'} hover:text-content transition-colors text-sm font-medium leading-normal`}
          >
            {t('movementEngine')}
          </button>

          <button
            onClick={() => onNavigate(Page.MIND_GAMES)}
            className={`${currentPage === Page.MIND_GAMES ? 'text-primary' : 'text-muted'} hover:text-content transition-colors text-sm font-medium leading-normal`}
          >
            {t('mindGames')}
          </button>

        </nav>

        <div className="flex gap-2">
          <button className="flex size-10 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-content hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>

        {user && (
          <div className="relative">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20 cursor-pointer hover:border-primary transition-all"
              style={{ backgroundImage: `url(${user.avatar})` }}
              onClick={() => setShowMenu(!showMenu)}
            />
            {showMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl py-2 z-50">
                {/* Theme Toggle Row */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-muted">{isDark ? 'dark_mode' : 'light_mode'}</span>
                    <span className="text-sm text-muted font-medium">{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="theme-toggle-cb"
                      className="theme-toggle-checkbox"
                      checked={!isDark}
                      onChange={toggleTheme}
                    />
                    <label htmlFor="theme-toggle-cb" className="theme-toggle-label">
                      <span className="theme-toggle-button">
                        <span className="theme-toggle-crater theme-crater-1"></span>
                        <span className="theme-toggle-crater theme-crater-2"></span>
                        <span className="theme-toggle-crater theme-crater-3"></span>
                        <span className="theme-toggle-crater theme-crater-4"></span>
                        <span className="theme-toggle-crater theme-crater-5"></span>
                        <span className="theme-toggle-crater theme-crater-6"></span>
                        <span className="theme-toggle-crater theme-crater-7"></span>
                      </span>
                      <span className="theme-star theme-star-1"></span>
                      <span className="theme-star theme-star-2"></span>
                      <span className="theme-star theme-star-3"></span>
                      <span className="theme-star theme-star-4"></span>
                      <span className="theme-star theme-star-5"></span>
                      <span className="theme-star theme-star-6"></span>
                      <span className="theme-star theme-star-7"></span>
                      <span className="theme-star theme-star-8"></span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={() => { onNavigate(Page.SETTINGS); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-muted hover:text-content hover:bg-primary/10 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  {t('settings')}
                </button>
                <button
                  onClick={() => { onLogout(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
