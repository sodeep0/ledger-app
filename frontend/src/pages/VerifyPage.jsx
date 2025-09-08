import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const prefilledEmail = location.state?.email || '';
  const [email, setEmail] = useState(prefilledEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API}users/verify`, { email, code });
      setSuccess('Verification successful. You can now login.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Verify Your Email</h1>
        {error && <div className="p-2 text-sm rounded bg-red-50 text-red-700">{error}</div>}
        {success && <div className="p-2 text-sm rounded bg-green-50 text-green-700">{success}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
            />
          </div>
          <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Verify</button>
          <button type="button" onClick={() => navigate('/login')} className="w-full px-4 py-2 font-bold text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100">Back to Login</button>
        </form>
      </div>
    </div>
  );
};

export default VerifyPage;


