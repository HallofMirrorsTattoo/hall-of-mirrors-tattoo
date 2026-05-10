'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface ClientAuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  signup: (email: string, password: string, first_name: string, last_name: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  activate: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('clientAccessToken');
    const storedData = localStorage.getItem('clientData');

    if (storedToken && storedData) {
      try {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedData));
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem('clientAccessToken');
        localStorage.removeItem('clientRefreshToken');
        localStorage.removeItem('clientData');
      }
    }

    setIsLoading(false);
  }, []);

  const signup = async (email: string, password: string, first_name: string, last_name: string, phone?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/signup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, first_name, last_name, phone }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      localStorage.setItem('clientAccessToken', data.accessToken);
      localStorage.setItem('clientRefreshToken', data.refreshToken);
      localStorage.setItem('clientData', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('clientAccessToken', data.accessToken);
      localStorage.setItem('clientRefreshToken', data.refreshToken);
      localStorage.setItem('clientData', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const activate = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/client/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Account activation failed');
      }

      const data = await response.json();
      localStorage.setItem('clientAccessToken', data.accessToken);
      localStorage.setItem('clientRefreshToken', data.refreshToken);
      localStorage.setItem('clientData', JSON.stringify(data.user));

      setAccessToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('clientAccessToken');
    localStorage.removeItem('clientRefreshToken');
    localStorage.removeItem('clientData');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <ClientAuthContext.Provider value={{ user, accessToken, isLoading, signup, login, activate, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within ClientAuthProvider');
  }
  return context;
}
