import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Storage, StorageKeys } from '../lib/storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  updateUser: (user: User) => void;
  checkBiometricAuth: () => Promise<boolean>;
  enableBiometricAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a stored token
      const token = Storage.get<string>(StorageKeys.AUTH_TOKEN);
      const storedUser = Storage.get<User>(StorageKeys.USER);
      
      if (token && storedUser) {
        // Try to validate token with backend
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, clear storage
          Storage.delete(StorageKeys.AUTH_TOKEN);
          Storage.delete(StorageKeys.USER);
          setUser(null);
        }
      } else {
        // Check if biometric auth is available and try it
        const biometricSuccess = await checkBiometricAuth();
        if (!biometricSuccess) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user, token } = await api.login(email, password);
      setUser(user);
      
      // Store credentials securely for biometric auth
      await SecureStore.setItemAsync('user_email', email);
      await SecureStore.setItemAsync('user_password', password);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const { user, token } = await api.signup(email, password, name);
      setUser(user);
      
      // Store credentials securely for biometric auth
      await SecureStore.setItemAsync('user_email', email);
      await SecureStore.setItemAsync('user_password', password);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.logout();
      setUser(null);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_password');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    Storage.set(StorageKeys.USER, updatedUser);
  };

  const checkBiometricAuth = async (): Promise<boolean> => {
    try {
      // Check if biometric hardware exists
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;
      
      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return false;
      
      // Check if we have stored credentials
      const email = await SecureStore.getItemAsync('user_email');
      const password = await SecureStore.getItemAsync('user_password');
      
      if (!email || !password) return false;
      
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access Fantasy.AI',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });
      
      if (result.success) {
        // Auto-login with stored credentials
        await login(email, password);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric auth check failed:', error);
      return false;
    }
  };

  const enableBiometricAuth = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        throw new Error('Biometric hardware not available');
      }
      
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        throw new Error('No biometrics enrolled on device');
      }
      
      // Test biometric auth
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication for Fantasy.AI',
        disableDeviceFallback: false,
      });
      
      if (!result.success) {
        throw new Error('Biometric authentication failed');
      }
      
      // Biometrics enabled successfully
      // Credentials are already stored during login/signup
    } catch (error) {
      console.error('Enable biometric auth failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
    updateUser,
    checkBiometricAuth,
    enableBiometricAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};