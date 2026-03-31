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
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (accessToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  logListening: (songTitle: string, artist: string, artwork: string, durationMs: number) => void;
  getAllUsers: () => Promise<User[]>;
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

  useEffect(() => {
    restoreSession();
    return () => {
      if (activityInterval.current) clearInterval(activityInterval.current);
    };
  }, []);

  // Update lastActive every 60 seconds while logged in
  useEffect(() => {
    if (user) {
      updateLastActive();
      activityInterval.current = setInterval(updateLastActive, 60000);
    } else {
      if (activityInterval.current) clearInterval(activityInterval.current);
    }
    return () => {
      if (activityInterval.current) clearInterval(activityInterval.current);
    };
  }, [user?.id]);

  const updateLastActive = async () => {
    if (!user) return;
    try {
      const now = new Date().toISOString();
      const updatedUser = { ...user, lastActive: now };
      setUser(updatedUser);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));

      // Also update in the users registry
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
      const idx = users.findIndex(u => u.id === user.id);
      if (idx >= 0) {
        users[idx] = { ...users[idx], lastActive: now };
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      }
    } catch (e) {
      console.warn('Failed to update lastActive:', e);
    }
  };

  const restoreSession = async () => {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      if (session) {
        setUser(JSON.parse(session));
        const history = await AsyncStorage.getItem(HISTORY_KEY);
        if (history) setListeningHistory(JSON.parse(history));
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // ⚡ Quick login: just type your name and sign in!
  const quickLogin = async (name: string) => {
    const userData: User = {
      id: Date.now().toString(),
      name: name.trim(),
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@user.local`,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // Register in users list
    const usersRaw = await AsyncStorage.getItem(USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    users.push(userData);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Set session
    setUser(userData);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    if (history) setListeningHistory(JSON.parse(history));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (found) {
        const { password: _, ...userData } = found;
        userData.lastActive = new Date().toISOString();
        setUser(userData);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        const history = await AsyncStorage.getItem(HISTORY_KEY);
        if (history) setListeningHistory(JSON.parse(history));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Login error:', e);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
      
      if (users.find(u => u.email?.toLowerCase() === email.toLowerCase())) {
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      };

      users.push(newUser);
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

      const { password: _, ...userData } = newUser;
      setUser(userData);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      return true;
    } catch (e) {
      console.warn('Signup error:', e);
      return false;
    }
  };

  const logout = async () => {
    if (user) await updateLastActive();
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
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
          lastActive: new Date().toISOString(),
        };

        // Register in users list
        const usersRaw = await AsyncStorage.getItem(USERS_KEY);
        const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        if (!users.find(u => u.email === userData.email)) {
          users.push(userData);
          await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        }

        setUser(userData);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        const history = await AsyncStorage.getItem(HISTORY_KEY);
        if (history) setListeningHistory(JSON.parse(history));
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Google login error:', e);
      return false;
    }
  };

  const logListening = async (songTitle: string, artist: string, artwork: string, durationMs: number) => {
    const entry: ListeningEntry = {
      songTitle, artist, artwork,
      timestamp: new Date().toISOString(),
      durationMs,
    };
    const updated = [entry, ...listeningHistory].slice(0, 100);
    setListeningHistory(updated);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  };

  // Admin: get all registered users
  const getAllUsers = async (): Promise<User[]> => {
    try {
      const usersRaw = await AsyncStorage.getItem(USERS_KEY);
      const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
      // Strip passwords before returning
      return users.map(({ password, ...u }: any) => u as User);
    } catch (e) {
      return [];
    }
  };

  const totalListeningMs = listeningHistory.reduce((sum, e) => sum + e.durationMs, 0);

  const isAdmin = user?.email === 'nishantkumar@gmail.com' || user?.email === 'nishant@admin.com';

  return (
    <AuthContext.Provider value={{
      user, isLoading, listeningHistory, totalListeningMs, isAdmin,
      quickLogin, login, signup, loginWithGoogle, logout, logListening, getAllUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
