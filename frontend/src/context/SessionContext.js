import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getSession, logoutSession } from '../services/api';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const version = useRef(0);
  const refreshSession = useCallback(async () => {
    const request = ++version.current;
    try {
      const result = await getSession();
      if (request === version.current) setUser(result.user);
      return result.user;
    } catch (error) {
      if (request === version.current) setUser(null);
      return null;
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, []);
  const invalidateSessionRequests = useCallback(() => { ++version.current; }, []);
  useEffect(() => {
    refreshSession();
    const check = () => refreshSession();
    window.addEventListener('focus', check);
    return () => { invalidateSessionRequests(); window.removeEventListener('focus', check); };
  }, [refreshSession, invalidateSessionRequests]);
  const logout = async () => {
    // Do not claim logout succeeded if the server could not clear its cookie.
    await logoutSession();
    ++version.current;
    setUser(null);
    ['token', 'user_name', 'user_role'].forEach(key => localStorage.removeItem(key));
  };
  return <SessionContext.Provider value={{ user, loading, refreshSession, logout }}>{children}</SessionContext.Provider>;
};
