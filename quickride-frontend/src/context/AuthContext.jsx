import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const initialState = {
  token: null,
  role: null,
  userId: null,
  driverId: null,
  isAuthenticated: false,
  loading: true,
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(initialState);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userId = localStorage.getItem("userId");
      const driverId = localStorage.getItem("driverId");

      if (token && role) {
        setAuth({
          token,
          role,
          userId: userId || null,
          driverId: driverId || null,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        setAuth({
          ...initialState,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Failed to restore auth from localStorage:", error);
      setAuth({
        ...initialState,
        loading: false,
      });
    }
  }, []);

  const login = ({ token, role, userId = null, driverId = null }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    if (userId) {
      localStorage.setItem("userId", userId);
    } else {
      localStorage.removeItem("userId");
    }

    if (driverId) {
      localStorage.setItem("driverId", driverId);
    } else {
      localStorage.removeItem("driverId");
    }

    setAuth({
      token,
      role,
      userId: userId || null,
      driverId: driverId || null,
      isAuthenticated: true,
      loading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("driverId");
    localStorage.removeItem("activeRideId");
    localStorage.removeItem("activeRide");
    localStorage.removeItem("currentRide");
    localStorage.removeItem("user");

    setAuth({
      ...initialState,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}