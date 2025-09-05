// src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AlertDialog from '../components/AlertDialog';
import { Button, Input, FormField } from '../components/ui';
import { useForm } from '../hooks';

const LoginPage = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  // Form validation
  const validate = (values) => {
    const errors = {};
    if (!values.email) errors.email = 'Email is required';
    if (!values.password) errors.password = 'Password is required';
    return errors;
  };

  // Form submission
  const handleSubmit = async (values) => {
    try {
      const user = await authService.login(values);
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

  const { values, errors, isSubmitting, handleChange, handleSubmit: onSubmit } = useForm(
    { email: '', password: '' },
    validate,
    handleSubmit
  );


  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-soft">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Login to Your Account</h1>
          <p className="mt-2 text-sm text-secondary-600">Welcome back! Please sign in to continue.</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            label="Email Address"
            name="email"
            required
            error={errors.email}
          >
            <Input
              type="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              error={!!errors.email}
              leftIcon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
          </FormField>
          
          <FormField
            label="Password"
            name="password"
            required
            error={errors.password}
          >
            <Input
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              error={!!errors.password}
              leftIcon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />
          </FormField>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>
          
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/register')}
              className="w-full"
            >
              Create Account
            </Button>
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