import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type User = {
  id: string;
  displayName: string;
  email: string;
  tenantId: string;
  loginTime: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap session on mount
  useEffect(() => {
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else if (response.status === 401) {
        // Not logged in
        setUser(null);
      } else {
        throw new Error('Failed to fetch user session');
      }
    } catch (err) {
      console.error('Bootstrap auth error:', err);
      setError(err instanceof Error ? err.message : 'Auth error');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Redirect to BFF login endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/login`;
  };

  const logout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        setError(null);
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

    const refreshSession = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setError(null);
        } else if (response.status === 401) {
          setUser(null);
        } else {
          throw new Error('Failed to refresh session');
        }
      } catch (err) {
        console.error('Refresh session error:', err);
        setUser(null);
      }
    };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
          refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
