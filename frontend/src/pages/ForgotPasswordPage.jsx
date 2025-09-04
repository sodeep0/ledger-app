import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AlertDialog from '../components/AlertDialog';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authService.requestPasswordReset(email);
      try {
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50';
        el.textContent = 'Verification code sent to your email.';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      } catch {}
      navigate('/forgot-password/verify', { state: { email } });
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to send reset code. Please try again.';
      setAlert({ open: true, title: 'Request Failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Forgot Password</h1>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Sending...' : 'Send Code'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full px-4 py-2 font-bold text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Login
          </button>
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

export default ForgotPasswordPage;


