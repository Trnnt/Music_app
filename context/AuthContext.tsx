import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  lastActive?: string;
}

interface ListeningEntry {
  songTitle: string;
  artist: string;
  artwork: string;
  timestamp: string;
  durationMs: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  listeningHistory: ListeningEntry[];
  totalListeningMs: number;
  quickLogin: (name: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  getGlobalStats: () => Promise<any>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
};

const USERS_KEY = '@registered_users';
const SESSION_KEY = '@current_session';
const HISTORY_KEY = '@listening_history';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listeningHistory, setListeningHistory] = useState<ListeningEntry[]>([]);
  const activityInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const heartbeatTimer = useRef<any>(null);

  // 📡 API Base URL (Change to your public server IP for friends)
  const API_URL = 'http://192.168.1.100:3000'; 
  const ADMIN_SECRET = 'nishant_rimuru_master_2026';

  useEffect(() => {
    restoreSession();
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, []);

  useEffect(() => {
    if (user) {
      startHeartbeat();
      setIsAdmin(user.email === 'nishantkumar@gmail.com' || user.email === 'nishant@admin.com');
    } else {
      stopHeartbeat();
      setIsAdmin(false);
    }
  }, [user?.email]);

  const startHeartbeat = () => {
    stopHeartbeat();
    sendHeartbeat(); // Immediate
    heartbeatTimer.current = setInterval(sendHeartbeat, 60000); // Every 1 minute for better accuracy
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
  };

  const sendHeartbeat = async () => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/api/auth/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
    } catch (e) {
      console.log('Heartbeat sync failed');
    }
  };

  const syncWithServer = async (userData: User) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success) return data.user;
    } catch (e) {
      console.warn('Backend sync failed, using local session');
    }
    return userData;
  };

  const restoreSession = async () => {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      if (session) {
        const localUser = JSON.parse(session);
        setUser(localUser);
        // Try to sync/refresh with server
        syncWithServer(localUser);
        
        const history = await AsyncStorage.getItem(HISTORY_KEY);
        if (history) setListeningHistory(JSON.parse(history));
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (name: string) => {
    const userData: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@user.local`,
      createdAt: new Date().toISOString(),
    };
    const finalUser = await syncWithServer(userData);
    setUser(finalUser);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));
  };

  const loginWithGoogle = async (accessToken: string): Promise<boolean> => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await res.json();
      
      if (googleUser.email) {
        const userData: User = {
          id: googleUser.id || Date.now().toString(),
          name: googleUser.name || googleUser.email.split('@')[0],
          email: googleUser.email,
          avatar: googleUser.picture,
          createdAt: new Date().toISOString(),
        };

        const finalUser = await syncWithServer(userData);
        setUser(finalUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(finalUser));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Google login error:', e);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    stopHeartbeat();
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      });
      return await res.json();
    } catch (e) {
      return [];
    }
  };

  // 👑 Admin helper for the Dashboard stats
  const getGlobalStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  };

  const totalListeningMs = listeningHistory.reduce((sum, e) => sum + e.durationMs, 0);

  return (
    <AuthContext.Provider value={{
      user, isLoading, listeningHistory, totalListeningMs, isAdmin,
      quickLogin, loginWithGoogle, logout, getAllUsers, getGlobalStats,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
