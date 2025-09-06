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
  const [showPassword, setShowPassword] = useState(false);

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
        navigate('/dashboard');
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
              type={showPassword ? "text" : "password"}
              name="password"
              value={values.password}
              onChange={handleChange}
              error={!!errors.password}
              leftIcon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightIcon={
                showPassword ? (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }
              onRightIconClick={() => setShowPassword(!showPassword)}
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