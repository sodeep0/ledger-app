// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  // If no user or no token, redirect to login
  if (!user || !user.token) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, show the page
  return children;
};

export default ProtectedRoute;