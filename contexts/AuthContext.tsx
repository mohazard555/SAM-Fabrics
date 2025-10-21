import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '../types';

const AUTH_KEY = 'sam-pro-current-user';

interface AuthContextType {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const item = sessionStorage.getItem(AUTH_KEY);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  const login = (user: User) => {
    try {
      const userToStore = { ...user };
      delete userToStore.password; // Do not store password in session storage
      sessionStorage.setItem(AUTH_KEY, JSON.stringify(userToStore));
      setCurrentUser(userToStore);
    } catch (error) {
        console.error("Failed to set session storage", error);
        setCurrentUser(user);
    }
  };
  
  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch (error) {
        console.error("Failed to remove session storage", error);
    } finally {
        setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};