// src/utils/constants.js
// Application constants and configuration

/**
 * API Configuration
 * 
 * Environment Variables Setup:
 * 1. Create a .env file in the frontend/ directory (not backend/)
 * 2. Add: VITE_API_URL=http://localhost:5000/api
 * 3. For production, update the URL to your deployed backend
 * 
 * Note: Vite uses import.meta.env for environment variables, not process.env
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  TIMEOUT: 10000,
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Approval Status
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  PAYMENT_IN: 'Payment In',
  PAYMENT_OUT: 'Payment Out',
};

// Payment Modes
export const PAYMENT_MODES = {
  CASH: 'Cash',
  BANK: 'Bank',
  ONLINE: 'Online Payment',
};

// Party Types
export const PARTY_TYPES = {
  SUPPLIER: 'Supplier',
  CUSTOMER: 'Customer',
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
};

// UI Constants
export const UI_CONSTANTS = {
  TOAST_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Navigation Items
export const NAVIGATION_ITEMS = {
  ADMIN: [
    { name: 'Admin', href: '/admin', icon: '🛡️' },
  ],
  USER: [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Parties', href: '/parties', icon: '👥' },
    { name: 'Transactions', href: '/transactions', icon: '📝' },
  ],
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully!',
  UPDATED: 'Updated successfully!',
  DELETED: 'Deleted successfully!',
  SAVED: 'Saved successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
};
