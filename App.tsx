
import React, { useState, useEffect } from 'react';
import { Page, User, Language, Movement } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MovementEngine from './components/MovementEngine';
import Ritual from './components/Ritual';
import Insights from './components/Insights';
import ProfileSettings from './components/ProfileSettings';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { translations } from './constants/translations';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [activeMovement, setActiveMovement] = useState<Movement | null>(null);

  const t = (key: keyof typeof translations['en']) => {
    const lang = user?.language || 'en';
    return translations[lang][key] || key;
  };

  const handleLogin = (userData: User) => {
    setUser({ 
      ...userData, 
      language: 'en', 
      goal: 'Deep Work',
      progress: {
        mentalClarity: 3.2,
        backHealth: 45,
        sessionsCompleted: 0
      }
    });
    setCurrentPage(Page.DASHBOARD);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage(Page.LOGIN);
  };

  const handleSelectMovement = (m: Movement) => {
    setActiveMovement(m);
    setCurrentPage(Page.RITUAL);
  };

  const handleSessionComplete = () => {
    if (!user) return;
    
    // Increment stats
    const newClarity = Math.min(5, user.progress.mentalClarity + 0.3);
    const newBack = Math.min(100, user.progress.backHealth + 8);
    
    setUser({
      ...user,
      progress: {
        mentalClarity: parseFloat(newClarity.toFixed(1)),
        backHealth: newBack,
        sessionsCompleted: user.progress.sessionsCompleted + 1
      }
    });
    
    setCurrentPage(Page.DASHBOARD);
    setActiveMovement(null);
  };

  if (currentPage === Page.LOGIN) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        t={t}
      />
      
      <div className="flex flex-1">
        <Sidebar 
          onNavigate={setCurrentPage} 
          currentPage={currentPage}
          t={t}
        />
        
        <main className="flex-1 flex flex-col bg-background-dark overflow-y-auto max-h-[calc(100vh-64px)]">
          {currentPage === Page.DASHBOARD && user && (
            <Dashboard 
              progress={user.progress}
              onStartRitual={() => setCurrentPage(Page.MOVEMENT_ENGINE)} 
              t={t} 
              lang={user.language}
            />
          )}
          {currentPage === Page.MOVEMENT_ENGINE && user && (
            <MovementEngine 
              onSelectMovement={handleSelectMovement} 
              t={t} 
              lang={user.language}
            />
          )}
          {currentPage === Page.RITUAL && user && (
            <Ritual 
              movement={activeMovement} 
              onBack={() => setCurrentPage(Page.MOVEMENT_ENGINE)} 
              onComplete={handleSessionComplete}
              t={t}
              lang={user.language}
            />
          )}
          {currentPage === Page.INSIGHTS && user && (
            <Insights 
              t={t}
              lang={user.language}
            />
          )}
          {currentPage === Page.SETTINGS && user && (
            <ProfileSettings 
              user={user} 
              onUpdateUser={handleUpdateUser} 
              t={t} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
