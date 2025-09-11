/**
 * LandingPage Component
 * 
 * This is the main landing page for LedgerPro application.
 * Features:
 * - Hero section with compelling value proposition
 * - Feature highlights with icons
 * - Call-to-action buttons for login and signup
 * - Responsive design for all devices
 * - Professional branding with LedgerPro logo
 */

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import authService from '../services/authService';

const LandingPage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isLoggedIn = user && user.token;

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                <img src="./logo_ledgerpro.jpg" alt="LedgerPro Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold text-secondary-900 truncate">LedgerPro</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {isLoggedIn ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                    <Button variant="primary" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-3">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-secondary-900 mb-4 sm:mb-6">
            Streamline Your
            <span className="text-primary-600 block">Business Finances</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-secondary-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            LedgerPro is the ultimate accounting solution for managing suppliers, customers, 
            and transactions with real-time balance tracking and comprehensive reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            {isLoggedIn ? (
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-3 sm:mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-base sm:text-lg text-secondary-600 max-w-2xl mx-auto px-4">
              Powerful features designed to simplify your accounting workflow and give you complete control over your finances.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Party Management</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Easily manage suppliers and customers with detailed contact information and transaction history.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-success-50 hover:bg-success-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Transaction Tracking</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Record and track all business transactions with automatic balance calculations and categorization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-warning-50 hover:bg-warning-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-warning-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Real-time Analytics</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Get instant insights into your business performance with real-time balance tracking and reporting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Secure & Reliable</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Your data is protected with enterprise-grade security and reliable cloud infrastructure.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">Fast & Efficient</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Lightning-fast performance with intuitive interface designed for maximum productivity.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-4 sm:p-6 rounded-xl bg-success-50 hover:bg-success-100 transition-colors">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-success-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-secondary-900 mb-2">User Friendly</h3>
              <p className="text-sm sm:text-base text-secondary-600">
                Simple, clean interface that makes accounting accessible to everyone, regardless of experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-primary-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of businesses already using LedgerPro to streamline their accounting processes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            {isLoggedIn ? (
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-black hover:bg-white hover:text-primary-600">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="./logo_ledgerpro.jpg" alt="LedgerPro Logo" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain mr-2 sm:mr-3" />
              <h3 className="text-xl sm:text-2xl font-bold">LedgerPro</h3>
            </div>
            <div className="text-center md:text-right">
              <p className="text-secondary-400 mb-1 sm:mb-2 text-sm sm:text-base">
                © 2024 LedgerPro. All rights reserved.
              </p>
              <p className="text-secondary-500 text-xs sm:text-sm">
                Professional accounting made simple.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
