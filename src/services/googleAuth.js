import { googleLogout } from '@react-oauth/google';

/**
 * Service to handle Google OAuth related operations.
 * Note: Most of the OAuth flow is handled by the GoogleOAuthProvider and hooks 
 * in the components, but this service provides helpers for session management.
 */

export const googleAuth = {
  /**
   * Signs the user out from Google and clears local session.
   */
  signOut: () => {
    googleLogout();
    localStorage.removeItem('google_user');
    localStorage.removeItem('google_access_token');
  },

  /**
   * Restores session from localStorage if available.
   */
  restoreSession: () => {
    const userStr = localStorage.getItem('google_user');
    const token = localStorage.getItem('google_access_token');
    
    if (userStr && token) {
      try {
        return {
          user: JSON.parse(userStr),
          accessToken: token
        };
      } catch (e) {
        console.error('Failed to parse stored user', e);
        return null;
      }
    }
    return null;
  },

  /**
   * Saves session to localStorage.
   */
  saveSession: (user, accessToken) => {
    localStorage.setItem('google_user', JSON.stringify(user));
    localStorage.setItem('google_access_token', accessToken);
  }
};
