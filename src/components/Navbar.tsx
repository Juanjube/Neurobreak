
import React, { useState } from 'react';
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

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#233648] px-4 md:px-10 py-3 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 md:gap-8">
        <button
          onClick={onToggleMenu}
          className="md:hidden text-[#92adc9] hover:text-white"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div
          className="flex items-center gap-3 text-primary cursor-pointer"
          onClick={() => onNavigate(Page.DASHBOARD)}
        >
          <img src="/Logo.jpg" alt="Logo" className="size-10 rounded-full object-cover" />
          <h2 className="text-white text-xl font-bold leading-tight tracking-tight">NeuroBreak</h2>
        </div>
        <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
          <div className="flex w-full flex-1 items-stretch rounded-xl h-full bg-[#233648]">
            <div className="text-[#92adc9] flex items-center justify-center pl-4">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent text-white focus:ring-0 placeholder:text-[#92adc9] px-4 pl-2 text-sm"
              placeholder={t('searchPlaceholder')}
            />
          </div>
        </label>
      </div>

      <div className="flex flex-1 justify-end gap-8 items-center">
        <nav className="hidden lg:flex items-center gap-8">
          <button
            onClick={() => onNavigate(Page.DASHBOARD)}
            className={`${currentPage === Page.DASHBOARD ? 'text-primary' : 'text-[#92adc9]'} hover:text-white transition-colors text-sm font-semibold leading-normal`}
          >
            {t('dashboard')}
          </button>

          <button
            onClick={() => onNavigate(Page.INSIGHTS)}
            className={`${currentPage === Page.INSIGHTS ? 'text-primary' : 'text-[#92adc9]'} hover:text-white transition-colors text-sm font-medium leading-normal`}
          >
            {t('cognitiveLab')}
          </button>

          <button
            onClick={() => onNavigate(Page.MOVEMENT_ENGINE)}
            className={`${currentPage === Page.MOVEMENT_ENGINE ? 'text-primary' : 'text-[#92adc9]'} hover:text-white transition-colors text-sm font-medium leading-normal`}
          >
            {t('movementEngine')}
          </button>

          <button
            onClick={() => onNavigate(Page.MIND_GAMES)}
            className={`${currentPage === Page.MIND_GAMES ? 'text-primary' : 'text-[#92adc9]'} hover:text-white transition-colors text-sm font-medium leading-normal`}
          >
            {t('mindGames')}
          </button>

        </nav>

        <div className="flex gap-2">
          <button className="flex size-10 items-center justify-center rounded-xl bg-[#233648] text-white hover:bg-[#2d455c] transition-colors">
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
              <div className="absolute right-0 mt-2 w-48 bg-card-dark border border-[#233648] rounded-xl shadow-2xl py-2 z-50">
                <button
                  onClick={() => { onNavigate(Page.SETTINGS); setShowMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#92adc9] hover:text-white hover:bg-primary/10 flex items-center gap-2"
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
