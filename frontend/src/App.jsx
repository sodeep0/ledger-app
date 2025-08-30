// src/App.jsx
import { Outlet, useNavigate } from 'react-router-dom';
import authService from './services/authService';

function App() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      {user && (
        <header className="bg-white shadow-md">
          <nav className="container mx-auto px-4 py-2 flex justify-between items-center">
            <h1 className="text-xl font-bold">Ledger App</h1>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </nav>
        </header>
      )}

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

export default App;