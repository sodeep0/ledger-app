// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AlertDialog from '../components/AlertDialog';
import { Button, Input, FormField } from '../components/ui';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const { name, email, password } = formData;
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (password !== confirmPassword) {
        setAlert({ open: true, title: 'Validation Error', message: 'Passwords do not match.' });
        return;
      }
      await authService.register({ name, email, password });
      navigate('/verify', { state: { email } });
    } catch (error) {
      console.error('Registration failed', error);
      setAlert({ open: true, title: 'Registration Failed', message: 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-soft">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Create an Account</h1>
          <p className="mt-2 text-sm text-secondary-600">Join LedgerPro and start managing your business finances.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormField
            label="Name"
            name="name"
            required
          >
            <Input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              leftIcon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          </FormField>

          <FormField
            label="Email Address"
            name="email"
            required
          >
            <Input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
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
          >
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={onChange}
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

          <FormField
            label="Confirm Password"
            name="confirmPassword"
            required
          >
            <Input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              rightIcon={
                showConfirmPassword ? (
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
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </FormField>
          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Register
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Already have an account? Login
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

export default RegisterPage;