import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getAuthToken, setAuthToken } from '@/services/api';

interface AuthContextType {
  user: { id: string; name: string; email: string } | null;
  session: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setSession(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setSession(token);
        const profile = await authApi.getProfile();
        if (profile.success && profile.data) {
          setUser(profile.data as { id: string; name: string; email: string });
        } else {
          setAuthToken(null);
          setSession(null);
          setUser(null);
        }
      } catch (_error) {
        setAuthToken(null);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrapAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Invalid credentials' };
      }

      setAuthToken(result.data.token);
      setSession(result.data.token);
      setUser(result.data.user as { id: string; name: string; email: string });
      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const result = await authApi.register(name, email, password);
      if (!result.success || !result.data) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      setAuthToken(result.data.token);
      setSession(result.data.token);
      setUser(result.data.user as { id: string; name: string; email: string });
      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Network error' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const result = await authApi.forgotPassword(email);
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to request reset' };
      }

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Network error' };
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      const result = await authApi.resetPassword('', newPassword);
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to reset password' };
      }

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    await authApi.logout();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session,
        isAuthenticated: !!session, 
        isLoading, 
        login, 
        register, 
        requestPasswordReset,
        resetPassword,
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
