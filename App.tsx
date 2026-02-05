
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
import { supabase, getProfile, signOut } from './services/supabase';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [user, setUser] = useState<User | null>(null);
  const [activeMovement, setActiveMovement] = useState<Movement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
        setCurrentPage(Page.LOGIN);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setCurrentPage(Page.LOGIN);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await getProfile(userId);
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        // Map DB profile to User object
        const userData: User = {
          name: data.full_name || 'Explorer',
          email: email,
          avatar: data.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8tVVenH4DAYEjgMcmJ3MhTfeSY7hLzxL3LH8vuuMQcXlK6UWw67D4PK06KVu6pjEAOdnthAhxmEstZY1xrmqeuFWfh_7tetgkURLbkZu6DoXIxztVqPmcJAxhRwI2CEKff6Zo78mLCSp_-Gmuwb-Sl-1n8gtW_pIQYXEFUripk-Qm_KWVDkSIue0_1GWTKVZPjEfKpAx0D2_LrFM8Wn-oo5KybVeuzSGTiy_1ogWLP9_blRY-6HjV4R-KgPKDIC8bdQ31orxbiTnH',
          goal: data.goal || 'Deep Work',
          language: (data.language as Language) || 'en',
          progress: {
            mentalClarity: data.mental_clarity || 3.2,
            backHealth: data.back_health || 45,
            sessionsCompleted: data.sessions_completed || 0
          }
        };
        setUser(userData);
        setCurrentPage(Page.DASHBOARD);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const t = (key: keyof typeof translations['en']) => {
    const lang = user?.language || 'en';
    return translations[lang][key] || key;
  };

  // Deprecated: Auth component now handles login internally via Supabase, 
  // and App listens to the state change. 
  // Keeping this as a placeholder/type satisfier if needed for Auth component prop, 
  // but Auth component doesn't strictly depend on it for logic anymore.
  const handleLogin = (userData: User) => {
     // This flow is replaced by onAuthStateChange
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // TODO: Update Supabase profile here
  };

  const handleLogout = async () => {
    await signOut();
    // onAuthStateChange will handle state updates
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
    // TODO: Persist session completion to DB
  };

  if (loading) {
     return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
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
