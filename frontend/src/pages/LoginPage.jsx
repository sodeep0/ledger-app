// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AlertDialog from '../components/AlertDialog';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const { email, password } = formData;
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await authService.login({ email, password });
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.approvalStatus !== 'approved') {
        setAlert({ open: true, title: 'Account Pending', message: 'Your account is pending approval. You will be notified once it is approved.' });
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed', error);
      const status = error?.response?.status;
      const message = (error?.response?.data?.message || '').toLowerCase();
      if (status === 403) {
        if (message.includes('rejected')) {
          setAlert({ open: true, title: 'Login Blocked', message: 'You are currently rejected. Please Contact Administrator' });
        } else if (message.includes('pending')) {
          setAlert({ open: true, title: 'Account Pending', message: 'Your account is pending approval. You will be notified once it is approved.' });
        } else {
          setAlert({ open: true, title: 'Access Denied', message: error?.response?.data?.message || 'Access denied.' });
        }
      } else if (status === 401) {
        setAlert({ open: true, title: 'Login Failed', message: 'Password is incorrect' });
      } else {
        setAlert({ open: true, title: 'Login Failed', message: 'Login failed. Please try again.' });
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login to Your Account</h1>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-indigo-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="space-y-3">
            <button
              type="submit"
              className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full px-4 py-2 font-bold text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
        </form>
      </div>
      <AlertDialog
        isOpen={alert.open}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ open: false, title: '', message: '' })}
      />
    </div>
  );
};

export default LoginPage;