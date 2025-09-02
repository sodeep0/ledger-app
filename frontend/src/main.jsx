// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import your page components
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PartiesPage from './pages/PartiesPage.jsx';
import PartyDetailsPage from './pages/PartyDetailsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import { ErrorBoundary, ErrorPage } from './components/ErrorBoundary.jsx';

// Define the routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ) },
      { path: 'parties', element: (
          <ProtectedRoute>
            <PartiesPage />
          </ProtectedRoute>
        ) },
      { path: 'parties/:partyType/:partyId', element: (
          <ProtectedRoute>
            <PartyDetailsPage />
          </ProtectedRoute>
        ) },
      { path: 'transactions', element: (
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        ) },
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
      // Catch-all route for undefined pages
      { path: '*', element: <ErrorPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);