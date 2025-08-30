// src/services/apiService.js
import axios from 'axios';

// Prefer environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/';

// Create a configured instance of axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject fresh token on each request
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = user ? user.token : '';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// --- Define API functions ---
export const createSupplier = (supplierData) => api.post('suppliers', supplierData);
export const createCustomer = (customerData) => api.post('customers', customerData);
export const createTransaction = (transactionData) => api.post('transactions', transactionData);
export const deleteTransaction = (transactionId) => api.delete(`transactions/${transactionId}`);
export const updateTransaction = (transactionId, transactionData) => api.put(`transactions/${transactionId}`, transactionData);
export const getSuppliers = () => api.get('suppliers');
export const getCustomers = () => api.get('customers');
export const getTransactions = (params) => api.get('transactions', { params });