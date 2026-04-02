import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initDB } from './db/index';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { googleAuth } from './services/googleAuth';
import { driveSync } from './services/driveSync';
import { ToastContainer } from './components/ui/ToastContainer';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { useOnlineSync } from './hooks/useOnlineSync';
import { Spinner } from './components/ui/Spinner';

// Pages
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import EventsListPage from './pages/EventsListPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import CategoriesPage from './pages/CategoriesPage';
import ColumnConfigPage from './pages/ColumnConfigPage';
import GlobalDashboardPage from './pages/GlobalDashboardPage';
import GlobalCategoriesPage from './pages/GlobalCategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import GlobalPeoplePage from './pages/GlobalPeoplePage';
import GlobalCategoryDetailPage from './pages/GlobalCategoryDetailPage';

export default function App() {
  const { user, setUser, setLoading, isLoading } = useAuthStore();
  const { theme } = useUIStore();
  
  useOnlineSync();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const restoreSession = async () => {
      const session = googleAuth.restoreSession();
      if (session) {
        setUser(session.user, session.accessToken);
        
        // Initial Drive Pull (Restore) — only when online
        if (navigator.onLine) {
          try {
            const cloudData = await driveSync.pull(session.accessToken);
            if (cloudData) {
              await driveSync.importData(cloudData);
              console.log('Restored data from Google Drive');
            }
          } catch (e) {
            console.error('Initial Drive pull failed', e);
          }
        }
      }
      
      try { 
        await initDB(); 
      } catch (e) { 
        console.error('DB init failed', e); 
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 transition-colors">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <div className="h-screen overflow-hidden flex flex-col bg-white dark:bg-gray-950 transition-colors">
        <OfflineBanner />
        <ToastContainer />
        <div className="flex-1 flex flex-col min-h-0 relative">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/events" replace /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/people" element={<GlobalPeoplePage />} />
                <Route path="/people/:categoryId" element={<GlobalCategoryDetailPage />} />
                <Route path="/events" element={<EventsListPage />} />
                <Route path="/events/new" element={<CreateEventPage />} />
                <Route path="/events/:eventId/edit" element={<EditEventPage />} />
                <Route path="/dashboard" element={<GlobalDashboardPage />} />
                <Route path="/categories" element={<GlobalCategoriesPage />} />
                <Route path="/events/:eventId/categories" element={<CategoriesPage />} />
                <Route path="/events/:eventId/categories/:categoryId/detail" element={<CategoryDetailPage />} />
                {/* Legacy route for compatibility */}
                <Route path="/events/:eventId/categories/:categoryId/people" element={<Navigate to="../detail" replace />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
