import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useStore } from '../store';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  linkFantasyAccount: (platform: string, credentials: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'fantasy_ai_auth_token';
const REFRESH_TOKEN_KEY = 'fantasy_ai_refresh_token';
const USER_DATA_KEY = 'fantasy_ai_user_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser, isAuthenticated, setAuthenticated } = useStore();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        setAuthenticated(true);
        
        // Check if token needs refresh
        await refreshToken();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // API call to login endpoint
      const response = await fetch('https://api.fantasy.ai/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Store tokens securely
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));
      
      setUser(data.user);
      setAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      
      // Reset store
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      
      // API call to signup endpoint
      const response = await fetch('https://api.fantasy.ai/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      
      // Store tokens securely
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, data.refreshToken);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(data.user));
      
      setUser(data.user);
      setAuthenticated(true);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Fantasy.AI',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return;

      const response = await fetch('https://api.fantasy.ai/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      // Update stored token
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout user
      await logout();
    }
  };

  const linkFantasyAccount = async (platform: string, credentials: any) => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      
      const response = await fetch(`https://api.fantasy.ai/auth/link/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Account linking failed');
      }

      const data = await response.json();
      
      // Update user data with linked accounts
      const updatedUser = { ...user, linkedAccounts: data.linkedAccounts };
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Account linking error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        signUp,
        authenticateWithBiometric,
        refreshToken,
        linkFantasyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}