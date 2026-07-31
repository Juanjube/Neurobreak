import React, { useState, useEffect } from 'react';
import { Page, User, Language, Movement, MindGame, MindGameSession } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MovementEngine from './components/MovementEngine';
import MindGames from './components/MindGames';
import Ritual from './components/Ritual';
import Insights from './components/Insights';
import ProfileSettings from './components/ProfileSettings';
import Profile from './components/Profile';
import AIChatButton from './components/AIChatButton';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { translations } from './constants/translations';
import { supabase, getProfile, signOut, updateProfile, logSession, getSessionHistory, getMindGameHistory } from './services/supabase';
import { calculateWellnessMetrics, PhysicalSession } from './utils/wellnessMetrics';
import { useAppSession } from './hooks/useAppSession';
import "flag-icons/css/flag-icons.min.css";

const App: React.FC = () => {
  // user almacena los datos del usuario logueado. Si es null, el usuario no ha iniciado sesión.
  const [user, setUser] = useState<User | null>(null);

  // Hook global de sesión para manejar navegación, scroll y filtros de forma agnóstica
  const appSession = useAppSession(user, Page.DASHBOARD);
  const {
    currentPage,
    setCurrentPage,
    setPageFilter,
    getPageFilter,
    isRestored,
    mainContainerRef,
  } = appSession;

  // activeMovement guarda el ejercicio o movimiento seleccionado actualmente para realizar
  const [activeMovement, setActiveMovement] = useState<Movement | null>(null);

  // loading indica si la aplicación está cargando datos iniciales (como la sesión del usuario)
  const [loading, setLoading] = useState(true);

  // mobileMenuOpen controla si el menú lateral (Sidebar) está abierto o cerrado en dispositivos móviles
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [physicalHistory, setPhysicalHistory] = useState<PhysicalSession[]>([]);
  const [mentalHistory, setMentalHistory] = useState<MindGameSession[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    // Al cargar la app, comprobamos si ya hay una sesión activa guardada en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Si hay un usuario, obtenemos su perfil desde la base de datos
        fetchProfile(session.user.id, session.user.email!);
      } else {
        // Si no hay sesión, dejamos de cargar y mostramos la pantalla de Login
        setLoading(false);
        setCurrentPage(Page.LOGIN);
      }
    });

    // Nos suscribimos a cualquier cambio de estado en la autenticación (ej: cuando el usuario inicia o cierra sesión)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email!);
      } else {
        // Al cerrar sesión, reseteamos el usuario y volvemos al Login
        setUser(null);
        setCurrentPage(Page.LOGIN);
        setLoading(false);
      }
    });

    // Limpiamos la suscripción cuando el componente se desmonta para evitar fugas de memoria
    return () => subscription.unsubscribe();
  }, []);

  // The histories are loaded once here so every surface consumes the same
  // calculated wellness state instead of producing independent diagnoses.
  useEffect(() => {
    if (!user) {
      setPhysicalHistory([]);
      setMentalHistory([]);
      return;
    }

    let isCurrent = true;
    const loadWellnessHistory = async () => {
      setMetricsLoading(true);
      setMetricsError(false);
      try {
        const [physicalResult, mentalResult] = await Promise.all([
          getSessionHistory(user.id),
          getMindGameHistory(user.id, 20),
        ]);
        if (physicalResult.error) throw physicalResult.error;
        if (mentalResult.error) throw mentalResult.error;
        if (isCurrent) {
          setPhysicalHistory((physicalResult.data || []) as PhysicalSession[]);
          setMentalHistory((mentalResult.data || []) as MindGameSession[]);
        }
      } catch (error) {
        console.error('Error loading wellness history:', error);
        if (isCurrent) setMetricsError(true);
      } finally {
        if (isCurrent) setMetricsLoading(false);
      }
    };

    loadWellnessHistory();
    return () => { isCurrent = false; };
  }, [user?.id, user?.progress.sessionsCompleted, user?.progress.mentalClarity, user?.progress.backHealth]);

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
          id: userId,
          name: data.full_name || 'Explorer',
          email: email,
          avatar: data.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8tVVenH4DAYEjgMcmJ3MhTfeSY7hLzxL3LH8vuuMQcXlK6UWw67D4PK06KVu6pjEAOdnthAhxmEstZY1xrmqeuFWfh_7tetgkURLbkZu6DoXIxztVqPmcJAxhRwI2CEKff6Zo78mLCSp_-Gmuwb-Sl-1n8gtW_pIQYXEFUripk-Qm_KWVDkSIue0_1GWTKVZPjEfKpAx0D2_LrFM8Wn-oo5KybVeuzSGTiy_1ogWLP9_blRY-6HjV4R-KgPKDIC8bdQ31orxbiTnH',
          goal: data.goal || 'Deep Work',
          language: (data.language as Language) || 'en',
          progress: {
            mentalClarity: data.mental_clarity ?? 0,
            backHealth: data.back_health ?? 0,
            sessionsCompleted: data.sessions_completed ?? 0
          }
        };
        setUser(userData);
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

  const handleLogin = (_userData: User) => {
    // This flow is replaced by onAuthStateChange
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (!user) return;

    // Get session ID to update profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await updateProfile(session.user.id, updatedUser);
      if (error) throw error;
      setUser(updatedUser);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  const handleSelectMovement = (m: Movement) => {
    setActiveMovement(m);
    setCurrentPage(Page.RITUAL);
  };

  const handleSessionComplete = async () => {
    if (!user) return;

    const newClarity = Math.min(10, user.progress.mentalClarity + 0.3);
    const newBack = Math.min(100, user.progress.backHealth + 5);
    const newSessions = user.progress.sessionsCompleted + 1;

    const updatedUser = {
      ...user,
      progress: {
        mentalClarity: parseFloat(newClarity.toFixed(1)),
        backHealth: newBack,
        sessionsCompleted: newSessions
      }
    };

    setUser(updatedUser);
    setCurrentPage(Page.DASHBOARD);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateProfile(session.user.id, {
          progress: updatedUser.progress
        });

        if (activeMovement) {
          await logSession(session.user.id, activeMovement.id, activeMovement.durationSeconds);
        }
      }
    } catch (e) {
      console.error("Error saving progress:", e);
    }

    setActiveMovement(null);
  };

  const handleMindGameComplete = async (_game: MindGame, _score: number | null, _duration: number, _variantSeed: string) => {
    if (!user) return;

    const newClarity = Math.min(10, user.progress.mentalClarity + 0.2);
    const updatedUser = {
      ...user,
      progress: {
        ...user.progress,
        mentalClarity: parseFloat(newClarity.toFixed(1))
      }
    };

    setUser(updatedUser);

    try {
      await updateProfile(user.id, {
        progress: updatedUser.progress
      });
    } catch (e) {
      console.error("Error saving mind game progress:", e);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-content">Loading...</div>;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const wellnessMetrics = calculateWellnessMetrics(user, physicalHistory, mentalHistory);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        t={t}
        cognitiveState={wellnessMetrics.cognitiveState}
        onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onNavigate={setCurrentPage}
          currentPage={currentPage}
          t={t}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          metrics={wellnessMetrics}
          metricsLoading={metricsLoading}
          metricsError={metricsError}
        />

        <main ref={mainContainerRef as React.RefObject<HTMLDivElement>} className="flex-1 flex flex-col bg-background overflow-y-auto w-full pb-20 md:pb-0 relative">
          {currentPage === Page.DASHBOARD && user && (
            <Dashboard
              progress={user.progress}
              wellnessMetrics={wellnessMetrics}
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
              categoryFilter={getPageFilter(Page.MOVEMENT_ENGINE, 'category', 'All')}
              onCategoryFilterChange={(cat) => setPageFilter(Page.MOVEMENT_ENGINE, 'category', cat)}
            />
          )}
          {currentPage === Page.MIND_GAMES && user && (
            <MindGames
              user={user}
              onCompleteGame={handleMindGameComplete}
              t={t}
              lang={user.language}
              categoryFilter={getPageFilter(Page.MIND_GAMES, 'category', 'All')}
              onCategoryFilterChange={(cat) => setPageFilter(Page.MIND_GAMES, 'category', cat)}
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
              user={user}
            />
          )}
          {currentPage === Page.SETTINGS && user && (
            <ProfileSettings
              user={user}
              onUpdateUser={handleUpdateUser}
              t={t}
            />
          )}
          {currentPage === Page.PROFILE && user && (
            <Profile
              user={user}
              onOpenSettings={() => setCurrentPage(Page.SETTINGS)}
            />
          )}
        </main>
      </div>
      {user && <AIChatButton t={t} lang={user.language} />}
    </div>
  );
};

export default App;
