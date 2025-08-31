import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // If user is logged in, redirect to dashboard
  if (user && user.token) {
    return <Navigate to="/" replace />;
  }
  
  // If user is not logged in, show the public page (login/register)
  return children;
};

export default PublicRoute;
