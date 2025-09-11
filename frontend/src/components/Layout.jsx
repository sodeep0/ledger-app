import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { NAVIGATION_ITEMS } from '../utils/constants';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    authService.logout();
    setIsSidebarOpen(false); // Close sidebar and remove overlay
    navigate('/');
  };

  const navigation = user?.role === 'admin' ? NAVIGATION_ITEMS.ADMIN : NAVIGATION_ITEMS.USER;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isAuthPage = (
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/verify' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/forgot-password/verify' ||
    location.pathname === '/forgot-password/reset'
  );

  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      {/* Sidebar */}
      {!isAuthPage && !isLandingPage && (
      <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0 w-56 sm:w-60' : '-translate-x-full w-56 sm:w-60'
      } ${isDesktopSidebarCollapsed ? 'lg:-translate-x-full lg:w-64' : 'lg:translate-x-0 lg:w-64'}`}>
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 border-b">
          <div className="flex items-center min-w-0">
            <img 
              src="/logo_ledgerpro.jpg" 
              alt="LedgerPro Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-contain flex-shrink-0"
            />
            <span className={`ml-2 text-sm sm:text-base font-bold text-gray-900 truncate transition-opacity duration-300 ${
              isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'lg:opacity-100'
            }`}>LedgerPro</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="mt-6 px-3 lg:px-6">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center px-3 lg:px-4 py-3 lg:py-4 text-sm font-medium rounded-md transition-all duration-300 ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isDesktopSidebarCollapsed ? item.name : ''}
              >
                <span className="mr-3 lg:mr-4 text-lg flex-shrink-0">{item.icon}</span>
                <span className={`truncate transition-opacity duration-300 ${
                  isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'lg:opacity-100'
                }`}>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 lg:p-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className={`ml-3 min-w-0 flex-1 transition-opacity duration-300 ${
                isDesktopSidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'lg:opacity-100'
              }`}>
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name || 'User'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
              title="Logout"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Main content */}
      <div className={isAuthPage || isLandingPage ? 'w-full' : `w-full transition-all duration-300 ${isDesktopSidebarCollapsed ? 'lg:pl-0' : 'lg:pl-64'}`}>
        {/* Top bar */}
        {!isAuthPage && !isLandingPage && (
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-8 xl:px-12 max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                aria-label="Open sidebar"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
                className="hidden lg:block p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                aria-label={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isDesktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center min-w-0">
                <img 
                  src="/logo_ledgerpro.jpg" 
                  alt="LedgerPro Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 rounded-lg object-contain flex-shrink-0"
                />
                <span className="ml-1.5 sm:ml-2 text-sm sm:text-base font-bold text-gray-900 truncate">LedgerPro</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Page content */}
        <main className={isLandingPage ? 'w-full' : 'w-full p-3 sm:p-4 lg:p-8 xl:p-12 max-w-full'}>
          <div className="w-full max-w-full overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
