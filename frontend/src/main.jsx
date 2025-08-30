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
import TransactionsPage from './pages/TransactionsPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Define the routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
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
      { path: 'transactions', element: (
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        ) },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);