import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AlertDialog from '../components/AlertDialog';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = location.state?.email || '';
  const initialCode = location.state?.code || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ open: false, title: '', message: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setAlert({ open: true, title: 'Validation Error', message: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(email, code, password);
      try {
        const el = document.createElement('div');
        el.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50';
        el.textContent = 'Password reset successful. You may now log in.';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
      } catch {}
      navigate('/login');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to reset password.';
      setAlert({ open: true, title: 'Reset Failed', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;


