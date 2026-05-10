'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface Artist {
  id: string;
  email: string;
  full_name: string;
  specialties?: string;
  instagram_handle?: string;
}

interface AuthContextType {
  artist: Artist | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('artistAccessToken');
    const savedArtist = localStorage.getItem('artistData');

    if (savedToken && savedArtist) {
      setAccessToken(savedToken);
      setArtist(JSON.parse(savedArtist));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/artist/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Save tokens and artist data
      localStorage.setItem('artistAccessToken', data.accessToken);
      localStorage.setItem('artistRefreshToken', data.refreshToken);
      localStorage.setItem('artistData', JSON.stringify(data.artist));

      setAccessToken(data.accessToken);
      setArtist(data.artist);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('artistAccessToken');
    localStorage.removeItem('artistRefreshToken');
    localStorage.removeItem('artistData');
    setAccessToken(null);
    setArtist(null);
  };

  return (
    <AuthContext.Provider value={{ artist, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
