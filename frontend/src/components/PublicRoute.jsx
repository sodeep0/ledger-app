import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // If user is logged in, redirect to appropriate dashboard
  if (user && user.token) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.approvalStatus === 'approved') {
      return <Navigate to="/dashboard" replace />;
    } else {
      // User is logged in but not approved, redirect to landing page
      return <Navigate to="/" replace />;
    }
  }
  
  // If user is not logged in, show the public page (login/register)
  return children;
};

export default PublicRoute;
