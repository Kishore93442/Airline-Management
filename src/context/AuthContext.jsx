import { createContext, useContext, useEffect, useState } from "react";

import api, {
  getCSRFToken,
  refreshAccessToken,
  setAccessToken,
  setAuthenticationFailureHandler,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProfile = async () => {
    const response = await api.get("auth/me/");
    setUser(response.data);
    return response.data;
  };

  // Login
  const login = async (username, password) => {
    await getCSRFToken();

    const response = await api.post("auth/login/", {
      username,
      password,
    });

    setAccessToken(response.data.access);

    await getProfile();

    return response.data;
  };

  // Logout
  const logout = async () => {
    try {
      await getCSRFToken();
      await api.post("auth/logout/", {});
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  // Restore login session after page refresh
  useEffect(() => {
    setAuthenticationFailureHandler(() => {
      setUser(null);
    });

    const initializeAuth = async () => {
      try {
        await getCSRFToken();

        await refreshAccessToken();

        await getProfile();
      } catch (error) {
        setAccessToken(null);
        setUser(null);

        console.log(
          "Authentication initialization:",
          error.response?.data || error.message,
        );
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      setAuthenticationFailureHandler(null);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
