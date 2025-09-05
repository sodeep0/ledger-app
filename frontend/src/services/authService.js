// src/services/authService.js
import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

const API_URL = `${API_CONFIG.BASE_URL}/users/`;

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL + 'register', userData);
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(API_URL + 'login', userData);
  if (response.data) {
    // Store user data and JWT in local storage
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  register,
  login,
  logout,
  requestPasswordReset: async (email) => {
    const response = await axios.post(API_URL + 'forgot-password', { email });
    return response.data;
  },
  verifyResetCode: async (email, code) => {
    const response = await axios.post(API_URL + 'forgot-password/verify', { email, code });
    return response.data;
  },
  resetPassword: async (email, code, newPassword) => {
    const response = await axios.post(API_URL + 'forgot-password/reset', { email, code, newPassword });
    return response.data;
  }
};

export default authService;