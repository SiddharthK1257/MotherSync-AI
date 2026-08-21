import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, healthAPI } from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_RISK = {
  riskLevel: 'routine',
  badge: { color: 'green', label: 'Routine Monitoring', code: '🟢' },
  summaryRationale: 'Vital signs within normal physiological ranges for current trimester.'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mothersync_token'));
  const [loading, setLoading] = useState(true);
  const [currentRisk, setCurrentRisk] = useState(DEFAULT_RISK);

  // Initialize or fetch user profile on app start
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('mothersync_token');
      if (savedToken && savedToken !== 'null' && savedToken !== 'undefined') {
        try {
          const res = await authAPI.getProfile();
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            setToken(savedToken);
          } else {
            handleLogout();
          }
        } catch (err) {
          console.warn('Session expired or profile fetch failed:', err.message);
          handleLogout();
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Sync latest risk telemetry whenever user or records change
  useEffect(() => {
    if (user && (user.role === 'patient' || !user.role)) {
      healthAPI.getHealthRecords()
        .then(res => {
          if (res.data?.currentRisk) {
            setCurrentRisk(res.data.currentRisk);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      if (res.data?.token) {
        localStorage.setItem('mothersync_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      if (res.data?.token) {
        localStorage.setItem('mothersync_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role = 'patient') => {
    setLoading(true);
    try {
      const res = await authAPI.demoLogin(role);
      if (res.data?.token) {
        localStorage.setItem('mothersync_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Demo login failed';
      console.error('Demo login error:', errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mothersync_token');
    setToken(null);
    setUser(null);
    setCurrentRisk(DEFAULT_RISK);
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const res = await authAPI.updateProfile(updates);
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
      }
      return res.data;
    } catch (err) {
      console.error('Update profile error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Update profile failed';
      throw new Error(errorMsg);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        currentRisk,
        setCurrentRisk,
        login: handleLogin,
        register: handleRegister,
        demoLogin: handleDemoLogin,
        logout: handleLogout,
        updateProfile: handleUpdateProfile,
        isDoctor: user?.role === 'doctor',
        isPatient: user?.role === 'patient' || !user?.role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
