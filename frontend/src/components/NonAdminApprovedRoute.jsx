import { Navigate } from 'react-router-dom';

const NonAdminApprovedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user || !user.token) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.approvalStatus !== 'approved') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default NonAdminApprovedRoute;


