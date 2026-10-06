import { useState, useEffect } from "react";
import api from "../services/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    let active = true;

    const loadUser = async () => {
      try {
        const res = await api.get("/auth/me");
        if (active) {
          setUser(res.data);
        }
      } catch {
        if (active) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("token");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.access_token);
    setToken(res.data.access_token);
    setLoading(true);
    const me = await api.get("/auth/me");
    setUser(me.data);
    setLoading(false);
  };

  const register = async (email, password, full_name) => {
    await api.post("/auth/register", { email, password, full_name });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
