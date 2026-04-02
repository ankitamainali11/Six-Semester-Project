import { useState, useEffect, createContext, useContext } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiService.setToken(token);
        const userData = await apiService.getCurrentUser();
        setUser(userData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      apiService.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      setIsAuthenticated(true);
      // Fetch full user profile after login so profile fields (phone, skills, bio, availability) are present
      const me = await apiService.getCurrentUser();
      if (me && me.user) {
        setUser(me.user);
      } else {
        setUser(response.user);
      }
      return me || response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password, role = 'volunteer', interests = undefined) => {
    try {
      const response = await apiService.register(name, email, password, role, interests);
      setIsAuthenticated(true);
      // Fetch full user profile after register
      const me = await apiService.getCurrentUser();
      if (me && me.user) {
        setUser(me.user);
      } else {
        setUser(response.user);
      }
      return me || response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const data = await apiService.getCurrentUser();
      if (data && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
      return data;
    } catch (error) {
      console.error('Refresh user failed:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      if (response && response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};