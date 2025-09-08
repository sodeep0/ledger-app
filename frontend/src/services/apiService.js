// src/services/apiService.js
import axios from 'axios';

// Prefer environment variable with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

// Supplier functions
export const createSupplier = (supplierData) => api.post('suppliers', supplierData);
export const getSuppliers = () => api.get('suppliers');
export const getSupplierById = (id) => api.get(`suppliers/${id}`);
export const updateSupplier = (id, supplierData) => api.put(`suppliers/${id}`, supplierData);
export const deleteSupplier = (id) => api.delete(`suppliers/${id}`);

// Customer functions
export const createCustomer = (customerData) => api.post('customers', customerData);
export const getCustomers = () => api.get('customers');
export const getCustomerById = (id) => api.get(`customers/${id}`);
export const updateCustomer = (id, customerData) => api.put(`customers/${id}`, customerData);
export const deleteCustomer = (id) => api.delete(`customers/${id}`);

// Generic party fetcher used by UI (customer or supplier)
export const getPartyById = (partyType, partyId) => {
  const base = partyType === 'supplier' ? 'suppliers' : 'customers';
  return api.get(`${base}/${partyId}`);
};

// Transaction functions
export const createTransaction = (transactionData) => api.post('transactions', transactionData);
export const getTransactions = (params) => api.get('transactions', { params });
export const updateTransaction = (transactionId, transactionData) => api.put(`transactions/${transactionId}`, transactionData);
export const deleteTransaction = (transactionId) => api.delete(`transactions/${transactionId}`);

// Get all transactions with pagination
export const getAllTransactions = async (params = {}) => {
  const allTransactions = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await api.get('transactions', { 
      params: { 
        ...params, 
        page, 
        limit: 100 // Use max limit per page
      } 
    });
    
    const { items, hasNextPage } = response.data;
    allTransactions.push(...items);
    hasMore = hasNextPage;
    page++;
  }
  
  return { data: { items: allTransactions, total: allTransactions.length } };
};

// Get transaction summaries for dashboard
export const getTransactionSummaries = (period = 'all-time') => api.get('transactions/summaries', { 
  params: { period } 
});

// Get transactions by party ID
export const getTransactionsByParty = (partyId, params = {}) => api.get('transactions', { 
  params: { 
    partyId: partyId,
    ...params 
  } 
});

// Get opening balance for a specific party and page
export const getOpeningBalance = (partyId, partyModel, params = {}) => api.get('transactions/opening-balance', {
  params: {
    partyId,
    partyModel,
    ...params
  }
});

// Admin / users
export const adminListUsers = () => api.get('users');
export const adminUpdateUserApproval = (id, status) => api.patch(`users/${id}/approval`, { status });
export const getMyStatus = () => api.get('users/me/status');