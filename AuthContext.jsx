import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { storage, refreshTokens, setAuthFailureHandler } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [notifications, setNotifications] = useState([]);
  const [liveTick, setLiveTick] = useState(0); // bumps on every live event so pages can refresh
  const socketRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      if (storage.refresh) await api.post('/auth/logout', { refreshToken: storage.refresh });
    } catch { /* token may already be invalid; local logout still proceeds */ }
    storage.clear();
    setUser(null);
    setNotifications([]);
  }, []);

  useEffect(() => {
    setAuthFailureHandler(() => { setUser(null); setNotifications([]); });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: u, accessToken, refreshToken } = res.data.data;
    storage.set({ accessToken, refreshToken });
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const updateUser = useCallback((u) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }, []);

  // Real-time connection, authenticated with the JWT access token.
  useEffect(() => {
    if (!user) return undefined;
    const socket = io(SOCKET_URL, {
      auth: (cb) => cb({ token: storage.access }),
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const add = (item) => {
      setNotifications((n) => [{ id: crypto.randomUUID(), time: new Date(), ...item }, ...n].slice(0, 20));
      setLiveTick((t) => t + 1);
      toast.info(item.text);
    };
    socket.on('announcement:new', (a) => add({ type: 'announcement', text: `New announcement: ${a.title}` }));
    socket.on('attendance:marked', (a) =>
      add({ type: 'attendance', text: `Attendance marked for ${a.courseCode}: ${a.status}` }));
    // If the access token expired before (re)connecting, refresh it and try again.
    socket.on('connect_error', async (err) => {
      if (/token/i.test(err.message) && storage.refresh) {
        try { await refreshTokens(); socket.connect(); } catch { /* handled by api interceptor */ }
      }
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    user, login, logout, updateUser, notifications, clearNotifications: () => setNotifications([]), liveTick,
  }), [user, login, logout, updateUser, notifications, liveTick]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
