import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { initDB } from './db/index';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './components/ui/ToastContainer';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Pages
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import EventsListPage from './pages/EventsListPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import CategoriesPage from './pages/CategoriesPage';
import ColumnConfigPage from './pages/ColumnConfigPage';
import PeopleListPage from './pages/PeopleListPage';
import DashboardPage from './pages/DashboardPage';
import GlobalDashboardPage from './pages/GlobalDashboardPage';
import GlobalCategoriesPage from './pages/GlobalCategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import GlobalPeoplePage from './pages/GlobalPeoplePage';
import GlobalCategoryDetailPage from './pages/GlobalCategoryDetailPage';

export default function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const restoreSession = async () => {
      const userId = localStorage.getItem('currentUserId');
      if (!userId) { setLoading(false); return; }
      try {
        const db = await initDB();
        const user = await db.get('users', userId);
        if (user) {
          setUser({ id: user.id, username: user.username, displayName: user.displayName });
        } else {
          localStorage.removeItem('currentUserId');
          setLoading(false);
        }
      } catch {
        setLoading(false);
      }
    };
    restoreSession();
  }, [setUser, setLoading]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <OfflineBanner />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/people" element={<GlobalPeoplePage />} />
            <Route path="/people/:categoryId" element={<GlobalCategoryDetailPage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/new" element={<CreateEventPage />} />
            <Route path="/events/:eventId/edit" element={<EditEventPage />} />
            <Route path="/events/:eventId/dashboard" element={<Navigate to="../categories" replace />} />
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
    </BrowserRouter>
  );
}
