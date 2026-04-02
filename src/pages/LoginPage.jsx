import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { googleAuth } from '../services/googleAuth';
import { driveSync } from '../services/driveSync';
import { Button } from '../components/ui/Button';
import { CalendarHeart, Moon, Sun, Chrome } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/events', { replace: true });
    }
  }, [user, navigate]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoggingIn(true);
      try {
        // Fetch user profile from Google
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        
        const userData = {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        };

        // Save session
        googleAuth.saveSession(userData, tokenResponse.access_token);
        
        // Initial Drive Pull (Restore) — only when online
        if (navigator.onLine) {
          try {
            const cloudData = await driveSync.pull(tokenResponse.access_token);
            if (cloudData) {
              await driveSync.importData(cloudData);
              console.log('Restored data from Google Drive on first login');
            }
          } catch (e) {
            console.error('Initial Drive pull failed', e);
          }
        }

        setUser(userData, tokenResponse.access_token);
        
        addToast(`Welcome back, ${profile.name}!`);
        navigate('/events');
      } catch (error) {
        console.error('Fetch user info failed:', error);
        addToast('Failed to get user profile. Please try again.', 'error');
      } finally {
        setIsLoggingIn(false);
      }
    },
    onError: () => {
      addToast('Google Login failed. Please try again.', 'error');
      setIsLoggingIn(false);
    },
    scope: 'https://www.googleapis.com/auth/drive.appdata', // Request Drive access now
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4 transition-colors relative">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-2xl p-8 border border-transparent dark:border-gray-800 relative group overflow-hidden">
        {/* Theme Toggle */}
        <button 
          onClick={useUIStore.getState().toggleTheme}
          className="absolute top-4 right-4 p-2.5 text-gray-400 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-800 rounded-xl transition-all z-10"
          title="Toggle Theme"
        >
          {useUIStore.getState().theme === 'light' ? (
            <Moon className="w-4 h-4" fill="currentColor" fillOpacity={0.1} />
          ) : (
            <Sun className="w-4 h-4" />
          )}
        </button>

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
            <CalendarHeart className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">InviteTracker</h1>
          <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-widest text-center px-4">
            Manage your events the traditional Indian way with cloud sync.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => { setIsLoggingIn(true); login(); }} 
            className="w-full py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/10"
            isLoading={isLoggingIn}
            icon={Chrome}
          >
            Sign in with Google
          </Button>
          
          <p className="text-[9px] text-center text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
            By signing in, you agree to store your event data securely in your own Google Drive.
          </p>
        </div>

        {/* Offline notice */}
        <div className="mt-12 pt-6 border-t border-gray-50 dark:border-gray-800 text-center">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
              Requires internet for first-time sign-in.
            </p>
        </div>
      </div>
    </div>
  );
}
