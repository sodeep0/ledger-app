// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import your page components
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PartiesPage from './pages/PartiesPage.jsx';
import PartyDetailsPage from './pages/PartyDetailsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import BatchTransactionsPage from './pages/BatchTransactionsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import NonAdminApprovedRoute from './components/NonAdminApprovedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import VerifyPage from './pages/VerifyPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import VerifyResetPage from './pages/VerifyResetPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
// Define the routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Landing page (public)
      { index: true, element: <LandingPage /> },
      
      // Public routes (no authentication required)
      { path: 'login', element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ) },
      { path: 'register', element: (
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        ) },
      { path: 'verify', element: (
          <PublicRoute>
            <VerifyPage />
          </PublicRoute>
        ) },
      { path: 'forgot-password', element: (
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        ) },
      { path: 'forgot-password/verify', element: (
          <PublicRoute>
            <VerifyResetPage />
          </PublicRoute>
        ) },
      { path: 'forgot-password/reset', element: (
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        ) },
      
      // Protected routes (authentication required)
      { path: 'dashboard', element: (
          <NonAdminApprovedRoute>
            <DashboardPage />
          </NonAdminApprovedRoute>
        ) },
      { path: 'parties', element: (
          <NonAdminApprovedRoute>
            <PartiesPage />
          </NonAdminApprovedRoute>
        ) },
      { path: 'parties/:partyType/:partyId', element: (
          <NonAdminApprovedRoute>
            <PartyDetailsPage />
          </NonAdminApprovedRoute>
        ) },
      { path: 'transactions', element: (
          <NonAdminApprovedRoute>
            <TransactionsPage />
          </NonAdminApprovedRoute>
        ) },
      { path: 'transactions/batch', element: (
          <NonAdminApprovedRoute>
            <BatchTransactionsPage />
          </NonAdminApprovedRoute>
        ) },
      
      // Admin routes
      { path: 'admin', element: (
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        ) },
      
    ],
  },
  // 404 page outside the main app layout (no sidebar)
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);