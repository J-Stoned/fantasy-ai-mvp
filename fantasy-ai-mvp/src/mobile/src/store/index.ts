import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { Player, Team, League, Lineup, Notification } from '../types';

const storage = new MMKV();

const zustandStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};

interface AppState {
  // Authentication
  user: any | null;
  isAuthenticated: boolean;
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: any) => void;

  // Leagues
  leagues: League[];
  activeLeague: League | null;
  setLeagues: (leagues: League[]) => void;
  setActiveLeague: (league: League) => void;

  // Teams & Lineups
  teams: Team[];
  activeLineup: Lineup | null;
  setTeams: (teams: Team[]) => void;
  setActiveLineup: (lineup: Lineup) => void;

  // Players
  players: Player[];
  watchlist: Player[];
  setPlayers: (players: Player[]) => void;
  addToWatchlist: (player: Player) => void;
  removeFromWatchlist: (playerId: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;

  // Settings
  theme: 'light' | 'dark' | 'auto';
  voiceEnabled: boolean;
  pushEnabled: boolean;
  biometricEnabled: boolean;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setVoiceEnabled: (enabled: boolean) => void;
  setPushEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;

  // App State
  isLoading: boolean;
  isOffline: boolean;
  lastSync: Date | null;
  setLoading: (loading: boolean) => void;
  setOffline: (offline: boolean) => void;
  setLastSync: (date: Date) => void;

  // Actions
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      leagues: [],
      activeLeague: null,
      teams: [],
      activeLineup: null,
      players: [],
      watchlist: [],
      notifications: [],
      unreadCount: 0,
      theme: 'auto',
      voiceEnabled: true,
      pushEnabled: true,
      biometricEnabled: true,
      isLoading: false,
      isOffline: false,
      lastSync: null,

      // Authentication actions
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setUser: (user) => set({ user }),

      // League actions
      setLeagues: (leagues) => set({ leagues }),
      setActiveLeague: (league) => set({ activeLeague: league }),

      // Team actions
      setTeams: (teams) => set({ teams }),
      setActiveLineup: (lineup) => set({ activeLineup: lineup }),

      // Player actions
      setPlayers: (players) => set({ players }),
      addToWatchlist: (player) =>
        set((state) => ({
          watchlist: [...state.watchlist, player],
        })),
      removeFromWatchlist: (playerId) =>
        set((state) => ({
          watchlist: state.watchlist.filter((p) => p.id !== playerId),
        })),

      // Notification actions
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        })),
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        })),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      // Settings actions
      setTheme: (theme) => set({ theme }),
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setPushEnabled: (enabled) => set({ pushEnabled: enabled }),
      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      // App state actions
      setLoading: (loading) => set({ isLoading: loading }),
      setOffline: (offline) => set({ isOffline: offline }),
      setLastSync: (date) => set({ lastSync: date }),

      // Initialize app
      initialize: async () => {
        set({ isLoading: true });
        try {
          // Load cached data or fetch from API
          // This would connect to your backend
          console.log('Initializing app store...');
          
          // Simulate loading
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          set({ isLoading: false, lastSync: new Date() });
        } catch (error) {
          console.error('Store initialization error:', error);
          set({ isLoading: false });
        }
      },

      // Reset store
      reset: () =>
        set({
          user: null,
          isAuthenticated: false,
          leagues: [],
          activeLeague: null,
          teams: [],
          activeLineup: null,
          players: [],
          watchlist: [],
          notifications: [],
          unreadCount: 0,
          isLoading: false,
          isOffline: false,
          lastSync: null,
        }),
    }),
    {
      name: 'fantasy-ai-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        voiceEnabled: state.voiceEnabled,
        pushEnabled: state.pushEnabled,
        biometricEnabled: state.biometricEnabled,
        watchlist: state.watchlist,
      }),
    }
  )
);