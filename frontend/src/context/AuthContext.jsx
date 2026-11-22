"use client";

import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("fridgeflow_token");
    const savedUser = localStorage.getItem("fridgeflow_user");
    if (savedToken) setToken(savedToken);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("fridgeflow_user");
      }
    }
    setLoadingAuth(false);
  }, []);

  const persistSession = (newToken, userData) => {
    localStorage.setItem("fridgeflow_token", newToken);
    localStorage.setItem("fridgeflow_user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: newToken, user: userData } = res.data.data;
    persistSession(newToken, userData);
    return res.data;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post("/auth/google", { credential });
    const { token: newToken, user: userData } = res.data.data;
    persistSession(newToken, userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    const { token: newToken, user: userData } = res.data.data;
    persistSession(newToken, userData);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("fridgeflow_token");
    localStorage.removeItem("fridgeflow_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loadingAuth,
        isAuthenticated: !!token,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
