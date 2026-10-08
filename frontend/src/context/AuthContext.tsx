import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    phone_number?: string;
    industry?: string;
    company_type?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bidready_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      const updatedUser: User = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone_number: data.phone_number,
        company_name: data.company?.name,
        company_id: data.company?.id,
      };
      setUser(updatedUser);
      localStorage.setItem('bidready_user', JSON.stringify(updatedUser));
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('bidready_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
    refreshUser();
  }, [token]);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    localStorage.setItem('bidready_token', res.access_token);
    setToken(res.access_token);
    const u: User = {
      id: res.user.id,
      email: res.user.email,
      full_name: res.user.full_name,
      company_name: res.user.company_name,
      company_id: res.user.company_id,
    };
    setUser(u);
    localStorage.setItem('bidready_user', JSON.stringify(u));
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    phone_number?: string;
    industry?: string;
    company_type?: string;
  }) => {
    const res = await api.register(data);
    localStorage.setItem('bidready_token', res.access_token);
    setToken(res.access_token);
    const u: User = {
      id: res.user.id,
      email: res.user.email,
      full_name: res.user.full_name,
      company_name: res.user.company_name,
      company_id: res.user.company_id,
    };
    setUser(u);
    localStorage.setItem('bidready_user', JSON.stringify(u));
  };

  const logout = () => {
    localStorage.removeItem('bidready_token');
    localStorage.removeItem('bidready_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
