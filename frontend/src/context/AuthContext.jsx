import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { apiUrl } from '../config/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get(apiUrl('/api/auth/me'));
        setUser(res.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, mfaCode = null) => {
    try {
      let res;
      if (mfaCode) {
        res = await axios.post(apiUrl('/api/auth/verify-mfa'), {
          ...credentials,
          mfaCode
        });
      } else {
        res = await axios.post(apiUrl('/api/auth/login'), credentials);
        if (res.data.mfaRequired) {
          setMfaRequired(true);
          return res.data;
        }
      }

      const { token, user: userData } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      setMfaRequired(false);
      toast.success('Welcome back, hacker!');
      return userData;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post(apiUrl('/api/auth/register'), userData);
      const { token, user: userDataResponse } = res.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userDataResponse);
      toast.success('Account created! Welcome to Cyberpunk CTF!');
      return userDataResponse;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setMfaRequired(false);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    setUser,
    login,
    register,
    logout,
    loading,
    mfaRequired,
    setMfaRequired,
    refreshUser: loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
