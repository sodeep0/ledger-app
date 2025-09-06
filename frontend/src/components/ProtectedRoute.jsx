// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  // If no user or no token, redirect to landing page
  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  // If not approved (and not admin), block access to protected pages
  if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
    return <Navigate to="/" replace />;
  }

  // If user is logged in and approved (or admin), show the page
  return children;
};

export default ProtectedRoute;